import asyncio
import pandas as pd
import time


class DataSource:
    def __init__(self, filepath, callback, chSize=1000, sleepTime=1):
        self.filepath = filepath
        self.callback = callback
        self.file = None
        self.chSize = chSize
        self.sleepTime = sleepTime
        self.setRestart = False

    def restart(self):
        pass

    def start(self):
        df = pd.read_csv(self.filepath, chunksize=self.chSize)
        for chunk in df:
            if self.setRestart:
                pass
            else:
                self.callback(chunk)
                time.sleep(self.sleepTime)


def test():
    pass


if __name__ == '__main__':
    test()
