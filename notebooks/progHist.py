import summarizer
from datasketches import kll_floats_sketch

class ProgHistogram:

    kllParam = 200

    def __init__(self, dim='x', dimValue='y', res=10, initialBufferSize=1000):
        #
        self._dim = dim
        self._dimValue = dimValue
        self._res = res
        #
        self._marginalDist = kll_floats_sketch(ProgHistogram.kllParam)        
        self._bbUpToInitialBuffer = {'min': float('inf'), 'max': float('-inf')}
        self._buffer = []
        self._initialBufferSize = initialBufferSize
        #
        self._bins = [{'counter':summarizer.Counter(),'gauss':summarizer.GaussianSummarizer()} for i in range(res)]
        #self._bins = [{'counter':summarizer.Counter(),'gauss':summarizer.GaussianSummarizer,'quantile':summarizer.KLLSummarizer()} for i in range(res)]
    
    def _bbAddPoint(self, v):
        self._bbUpToInitialBuffer['min'] = min(self._bbUpToInitialBuffer['min'], v)
        self._bbUpToInitialBuffer['max'] = max(self._bbUpToInitialBuffer['max'], v)

    def getNumPoints(self):
        return self._marginalDist.get_n()

    def updateBin(self,binIndex,v):
        for key in self._bins[binIndex]:
            self._bins[binIndex][key].update(v)

    def updateWithDataFrame(self, df, columnX, columnY):
        for row in df.iterrows():
            self.update((row[1][columnX], row[1][columnY]))

    def update(self, pt):
        "Point is an elment of type (x,y)"
        # update marginal distributions
        self._marginalDist.update(pt[0])
        # update bounding box
        numPointsAlreadyStored = self.getNumPoints()
        if numPointsAlreadyStored < self._initialBufferSize:
            self._buffer.append(pt)
            self._bbAddPoint(pt[0])
        elif numPointsAlreadyStored == self._initialBufferSize:
            # build first summary
            self._buffer.append(pt)
            self._bbAddPoint(pt[0])
            #self.valueBB = self._getValueRange()
            for pt in self._buffer:
                # bin
                binIndex = min(self._res-1, int(((pt[0] - self._bbUpToInitialBuffer['min'])/(self._bbUpToInitialBuffer['max'] - self._bbUpToInitialBuffer['min']))*self._res))
                self.updateBin(binIndex,pt[1])
        else:
            # bin
            binIndex = min(self._res-1, int(((pt[0] - self._bbUpToInitialBuffer['min'])/(self._bbUpToInitialBuffer['max'] - self._bbUpToInitialBuffer['min']))*self._res))
            if 0 <= binIndex < self._res:  
                self.updateBin(binIndex,pt[1])


    def getHist(self, _type):
        if self.getNumPoints() >= self._initialBufferSize:
            if _type == 'counter':
                points = []
                _min = self._bbUpToInitialBuffer['min']
                _max = self._bbUpToInitialBuffer['max']
                binSize = (_max - _min) / self._res
                for i in range(self._res):
                    x = _min + binSize * i
                    points.append([x,self._bins[i]['counter'].summary({})])
                #
                return {'points':points,'label':self._dim}
            elif _type == 'gauss':
                points = []
                _min = self._bbUpToInitialBuffer['min']
                _max = self._bbUpToInitialBuffer['max']
                binSize = (_max - _min) / self._res
                for i in range(self._res):
                    x = _min + binSize * i
                    points.append([x] + self._bins[i]['gauss'].summary({}))
                #
                return {'points':points,'label':self._dim}
            elif _type == 'quantile':
                pass
            else:
                halt
        else:
            return None

def test():
    import datasource
    def processCountChunk(chunk,progress):
        progHist.updateWithDataFrame(chunk,progHist._dim,progHist._dimValue)
        print(progHist.getHist('gauss'))
        print('Progress',progress)        

    progHist = ProgHistogram('B', 'A', 10, 20)
    datasource.DataSource("data/sample.csv",processCountChunk,10).start()   

if __name__ == '__main__':
    test()