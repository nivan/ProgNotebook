from abc import ABC, abstractmethod
from math import fsum
from datasketches import kll_floats_sketch

class Summarizer:

    def __init__(self):
        pass

    @ abstractmethod
    def count(self):
        return NotImplemented

    @ abstractmethod
    def udpate(self, pt):
        return NotImplemented

    @ abstractmethod
    def summary(self, params):
        return NotImplemented

class Counter(Summarizer):
    def __init__(self):
        super().__init__()
        self._counter = 0

    def count(self):
        return self._counter

    def update(self, pt):
        self._counter += 1

    def summary(self,params):
        return self._counter

class GaussianSummarizer(Summarizer):
    def __init__(self):
        super().__init__()    
        self._counter = 0
        self._sum = 0.0
        self._sumSqs = 0.0

    def count(self):
        return self._counter

    def update(self, v):
        self._counter += 1
        self._sum = fsum([self._sum,v])
        self._sumSqs = fsum([self._sumSqs,v*v])

    def summary(self,params={}):
        mean = 0 if (self._counter==0) else (self._sum/self._counter)        
        variance = 0 if (self._counter==0) else ((self._sumSqs - (self._sum)**2)/self._counter)
        return [self._counter, mean, variance]

class KLLSummarizer(Summarizer):
    def __init__(self):
        super().__init__()    
        self._sketch = kll_floats_sketch(200) #TODO: for now fixing this parameter

    def count(self):
        return self._sketch.get_n()

    def update(self, v):
        self._sketch.update(v)
        
    def quantile(self,q):
        return self._sketch.quantile(q)

    def hist(self,nBins,interval=None):
        if interval != None:
            xMin, xMax = self._sketch.get_min_value()
        else:
            xMin, xMax = self._sketch.get_min_value(), self._sketch.get_max_value    

        numSplits = nBins + 1        
        step = (xMax - xMin) / numSplits
        splits = [xMin + (i*step) for i in range(0, numSplits)]
        pmf = self._sketch.get_pmf(splits) 
        x = splits  
        pmf.pop() # remove the last one which are the estimate for the ones above max
        return [x, pmf]

    def summary(self,params):        
        return [self._sketch.get_quantile(q) for q in params]

def test():
    temp = KLLSummarizer()
    print(temp.summary([0,0.25,0.5,0.75,1.0]))
    temp.update(10)
    print(temp.summary([0,0.25,0.5,0.75,1.0]))

if __name__ == '__main__':
    test()