from enum import Enum
from math import fsum, isnan
import numpy as np
from abc import ABC, abstractmethod
import pandas as pd
from datasketches import kll_floats_sketch
from fast_histogram import histogram1d

class Aggregation(Enum):
    COUNT = 0
    MEAN = 1
    MEDIAN = 2


class Axis(Enum):
    X = 0
    Y = 1
    Z = 2


class BinnedScat:

    kllParam = 200

    def __init__(self, _callback, x='x', y='y', z='z', resX=10, resY=10, initialBufferSize=1000):        
        #
        self._dimX = x
        self._dimY = y
        self._dimZ = z
        #
        self._callback = _callback
        #
        self._resX = resX
        self._resY = resY
        #
        self._marginalX = kll_floats_sketch(BinnedScat.kllParam)
        self._marginalY = kll_floats_sketch(BinnedScat.kllParam)
        self._marginalZ = kll_floats_sketch(BinnedScat.kllParam)

        self._bb = {'xMin': float('inf'), 'xMax': float(
            '-inf'), 'yMin': float('inf'), 'yMax': float('-inf'),
            'zMin': float('inf'), 'zMax': float('-inf')}
        self.valueBB = None
        self._buffer = []
        self._initialBufferSize = initialBufferSize

    def _bbAddPoint(self, pt):
        self._bb['xMin'] = min(self._bb['xMin'], pt[0])
        self._bb['xMax'] = max(self._bb['xMax'], pt[0])
        self._bb['yMin'] = min(self._bb['yMin'], pt[1])
        self._bb['yMax'] = max(self._bb['yMax'], pt[1])
        self._bb['zMin'] = min(self._bb['zMin'], pt[2])
        self._bb['zMax'] = max(self._bb['zMax'], pt[2])

    def getNumPoints(self):
        return self._marginalX.get_n()

    def updateWithDataFrame(self, df, columnX, columnY, columnZ):
        for row in df.iterrows():
            self.update((row[1][columnX], row[1][columnY], row[1][columnZ]))

    def update(self, pt):
        "Point is an elment of type (x,y,z)"
        # update marginal distributions
        hasMissingData = False
        if not isnan(pt[0]):
            self._marginalX.update(pt[0])
        else:
            hasMissingData = True
        if not isnan(pt[1]):
            self._marginalY.update(pt[1])
        else:
            hasMissingData = True
        if not isnan(pt[2]):
            self._marginalZ.update(pt[2])
        else:
            hasMissingData = True            
        
        #only add to the scatterplot full points
        if hasMissingData:
            return

        # update bounding box
        numPointsAlreadyStored = self.getNumPoints()
        if numPointsAlreadyStored < self._initialBufferSize:
            self._buffer.append(pt)
            self._bbAddPoint(pt)
        elif numPointsAlreadyStored == self._initialBufferSize:
            # build first summary            
            self._buffer.append(pt)
            for pt in self._buffer:
                # bin
                xIndex = min(
                    self._resX-1, int(((pt[0] - self._bb['xMin'])/(self._bb['xMax'] - self._bb['xMin']))*self._resX))
                yIndex = min(
                    self._resY-1, int(((pt[1] - self._bb['yMin'])/(self._bb['yMax'] - self._bb['yMin']))*self._resY))                                
                self._addPoint((xIndex, yIndex), pt)
            # fix bb and
            self._bbAddPoint(pt)
            self.valueBB = self._getValueRange()
        else:
            # bin
            xIndex = int(((pt[0] - self._bb['xMin']) /
                         (self._bb['xMax'] - self._bb['xMin']))*self._resX)
            yIndex = int(((pt[1] - self._bb['yMin']) /
                         (self._bb['yMax'] - self._bb['yMin']))*self._resY)            

            if 0 <= xIndex < self._resX and 0 <= yIndex < self._resY:  # key not in self._bins:
                self._addPoint((xIndex, yIndex), pt)

    def setBoundingBox(self, newBB):
        self._bb = newBB

    def getFixedBoundingBox(self):
        return [[self._bb['xMin'], self._bb['xMax']], [self._bb['yMin'], self._bb['yMax']], [self._bb['zMin'], self._bb['zMax']]]

    def getCountHistogram(self,numBins=10,range=None):
        if range == None:
            range = [np.amin(self._counts),np.amax(self._counts)]
        hist = histogram1d(self._counts,numBins,range)
        return {'range':range,'numBins':numBins,'values':hist}

    def getMarginalHistogram(self, axis, nBins=10):
        kll = None
        if axis == Axis.X:
            kll = self._marginalX
        elif axis == Axis.Y:
            kll = self._marginalY
        else:
            kll = self._marginalZ

        numSplits = nBins + 1
        xMin = kll.get_min_value()
        step = (kll.get_max_value() - xMin) / numSplits
        splits = [xMin + (i*step) for i in range(0, numSplits)]
        pmf = kll.get_pmf(splits) 
        x = splits  
        pmf.pop() # remove the last one which are the estimate for the ones above max
        return [x, pmf]

    def processCountChunk(self,chunk,progress):                        
        self.updateWithDataFrame(chunk, self._dimX, self._dimY, self._dimZ)
        valueBB = self.getAggregationRange()
        summary = self.getSummary()
        # build data to pass to widget
        if summary:
            bbox = self.getFixedBoundingBox()
            scatData = {'xDomainRange': bbox[0],
                    'yDomainRange': bbox[1],
                    'zDomainRange': valueBB,
                    'xRes': self._resX,
                    'yRes': self._resY,
                    'xLabel': self._dimX,
                    'yLabel': self._dimY,
                    'zLabel': self._dimZ,
                    'sparse': 0,
                    'type': 'count',
                    'bins': summary[0].tolist(),
                    'counts': summary[1].tolist()
                    }

            #
            histResolution = 10
            pointsX = self.getMarginalHistogram(Axis.X,histResolution)
            pointsX = [[pointsX[0][i],pointsX[1][i]] for i in range(len(pointsX[0]))]
            #
            pointsY = self.getMarginalHistogram(Axis.Y,histResolution)
            pointsY = [[pointsY[0][i],pointsY[1][i]] for i in range(len(pointsY[0]))]
            #
            zHist = self.getCountHistogram()
            numSplits = 10 + 1
            xMin = zHist['range'][0]
            xMax = zHist['range'][1]
            step = (xMax - xMin) / numSplits
            splits = [xMin + (i*step) for i in range(0, numSplits)]
            pointsZ = list(zip(splits,list(zHist['values'])))
            #
            mx = {'points': pointsX, 'xLabel': 'Marginal ' + self._dimX}        
            my = {'points': pointsY, 'xLabel': 'Marginal ' + self._dimY}
            mz = {'points': pointsZ, 'xLabel': 'Marginal ' + self._dimZ}
            obj = {"mx":mx,"my":my,"mz":mz}
            myProgress = {'current': progress[0], 'max': progress[1]}
            #
            self._callback(scatData,obj,myProgress)

    def processChunk(self,chunk,progress):                        
        self.updateWithDataFrame(chunk, self._dimX, self._dimY, self._dimZ)
        valueBB = self.valueBB#self.getAggregationRange()
        summary = self.getSummary()
        # build data to pass to widget
        if summary:
            bbox = self.getFixedBoundingBox()
            scatData = {'xDomainRange': bbox[0],
                    'yDomainRange': bbox[1],
                    'zDomainRange': valueBB,
                    'xRes': self._resX,
                    'yRes': self._resY,
                    'xLabel': self._dimX,
                    'yLabel': self._dimY,
                    'zLabel': self._dimZ,
                    'type': 'aggr',
                    'sparse': 0,
                    'bins': summary[0].tolist(),
                    'counts': summary[1].tolist()
                    }

            #
            histResolution = 10
            pointsX = self.getMarginalHistogram(Axis.X,histResolution)
            pointsX = [[pointsX[0][i],pointsX[1][i]] for i in range(len(pointsX[0]))]
            #
            pointsY = self.getMarginalHistogram(Axis.Y,histResolution)
            pointsY = [[pointsY[0][i],pointsY[1][i]] for i in range(len(pointsY[0]))]
            #
            zHist = self.getCountHistogram()
            numSplits = 10 + 1
            xMin = zHist['range'][0]
            xMax = zHist['range'][1]
            step = (xMax - xMin) / numSplits
            splits = [xMin + (i*step) for i in range(0, numSplits)]
            pointsZ = list(zip(splits,list(zHist['values'])))
            #
            mx = {'points': pointsX, 'xLabel': 'Marginal ' + self._dimX}        
            my = {'points': pointsY, 'xLabel': 'Marginal ' + self._dimY}
            mz = {'points': pointsZ, 'xLabel': 'Marginal ' + self._dimZ}
            obj = {"mx":mx,"my":my,"mz":mz}
            myProgress = {'current': progress[0], 'max': progress[1]}
            #
            self._callback(scatData,obj,myProgress)

    def getAggregationRange(self):
        return self.valueBB

    @ abstractmethod
    def _addPoint(self, key, pt):
        return NotImplemented

    @abstractmethod
    def _getValueRange(self):
        return NotImplemented

    @ abstractmethod
    def aggregate(self, key, pt):
        return NotImplemented

    @ abstractmethod
    def getSummary(self):
        return NotImplemented


class CountBinScat(BinnedScat):
    def __init__(self, _callback, x, y, z, resX, resY, initialBufferSize):
        super().__init__(_callback,x, y, z, resX, resY, initialBufferSize)
        self._bins = np.zeros((resX, resY))
        self._counts = self._bins

    def _addPoint(self, key, pt):
        self._bins[key[0]][key[1]] += 1

    def getCount(self):
        return self._bins.flatten()

    def _getValueRange(self):
        return [self._bins.min(), self._bins.max()]

    def getAggregationRange(self):
        return self._getValueRange()

    def getSummary(self):
        if self.getNumPoints() >= self._initialBufferSize:
            result = self._bins.flatten()  # maybe store already flattened            
            return (result, result)
        else:
            return None

class MeanBinScat(BinnedScat):
    def __init__(self, _callback, x, y, z, resX, resY, initialBufferSize):
        super().__init__(_callback, x, y, z, resX, resY, initialBufferSize)
        self._bins = np.zeros((resX, resY))
        self._counts = np.zeros((resX, resY))

    def _addPoint(self, key, pt):
        # used fsum to take care of possible numerical problems
        self._bins[key[0]][key[1]] = fsum([pt[2], self._bins[key[0]][key[1]]])
        self._counts[key[0]][key[1]] += 1

    def _getValueRange(self):
        results = [float('inf'), float('-inf')]
        for i in range(self._bins.shape[0]):
            for j in range(self._bins.shape[1]):
                if self._counts[i, j] > 0:
                    results[0] = min(
                        results[0], self._bins[i, j]/self._counts[i, j])
                    results[1] = max(
                        results[1], self._bins[i, j]/self._counts[i, j])

        return results

    def getSummary(self):
        if self.getNumPoints() >= self._initialBufferSize:
            result = self._bins.flatten()  # maybe store already flattened
            counts = self._counts.flatten()
            means = [result[i]/counts[i] if counts[i]
                     > 0 else 0 for i in range(len(counts))]
            return (means, counts.tolist())
        else:
            return None


class QuantileBinScat(BinnedScat):
    def __init__(self, _callback, x, y, z, resX, resY, initialBufferSize):
        super().__init__(_callback, x, y, z, resX, resY, initialBufferSize)
        self._bins = {}

    def _addPoint(self, key, pt):
        if key not in self._bins:
            self._bins[key] = kll_floats_sketch(BinnedScat.kllParam)
        self._bins[key].update(pt[2])

    def getSummary(self, q):
        # this shoudl use the default for not available
        result = np.zeros((self._resX, self._resY))
        for i in range(self._resX):
            for j in range(self._resY):
                if (i, j) in self._bins:
                    result[i, j] = self._bins[(i, j)].get_quantile(q)

        return result  # TODO: flatten??


def test():
    import pandas as pd
    import time
    import BinnedScat
    #

    def loader(filepath, chSize, callback, sleepTime):
        df = pd.read_csv(filepath, chunksize=chSize)
        for chunk in df:
            callback(chunk)
            time.sleep(sleepTime)
    #

    def processChunk(chunk):
        scat.updateWithDataFrame(chunk, 'A', 'B', 'C')
        summary = scat.getSummary()
        # build data to pass to widget
        if summary:
            bbox = scat.getBoundingBox()
            scatData = {'xDomainRange': bbox[0],
                        'yDomainRange': bbox[1],
                        'zDomainRange': bbox[2],
                        'xRes': scat._resX,
                        'yRes': scat._resY,
                        'xLabel': 'xAxis',
                        'yLabel': 'yAxis',
                        'zLabel': 'zLabel',
                        'sparse': 0,
                        'bins': summary[0],
                        'counts': summary[1]
                        }
    #
    scat = BinnedScat.CountBinScat('A', 'B', 'C', 10, 10, 20)
    loader('data/sample.csv', 10, processChunk, 1)


if __name__ == '__main__':
    test()
