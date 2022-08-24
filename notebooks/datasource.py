import asyncio
import pandas as pd
import time
import os

def getNumChunks(filepath, chSize):
    df = pd.read_csv(filepath, chunksize=chSize)
    count = 0
    for chunk in df:
        count += 1
    return count

class DataSource:
    def __init__(self, filepath, callback, chSize=1000, sleepTime=1):
        self.filepath = filepath
        self.callback = callback
        self.file = None
        self.chSize = chSize
        self.sleepTime = sleepTime
        self.setRestart = False
        #TODO: bad option but made this in order to implement it fast
        self.numChunks = getNumChunks(filepath, chSize)#os.stat(filepath).st_size 
        self.numChunksProcessed = 0

    def restart(self):
        pass

    def getProgress(self):
        return (self.numChunksProcessed,self.numChunks)

    def start(self):
        self.numChunksProcessed = 0
        _file = open(self.filepath)
        df = pd.read_csv(_file, chunksize=self.chSize)

        for chunk in df:
            if self.setRestart:
                break
            else:
                self.numChunksProcessed += 1
                self.callback(chunk,self.getProgress())
                time.sleep(self.sleepTime)

        if self.setRestart:
            print('Restarting')
            _file.close()
            self.setRestart = False
            self.start()

def test():
    pass


if __name__ == '__main__':
    test()
