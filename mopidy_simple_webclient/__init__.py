# Simple Mopidy web client.
#
# Author: Peter Odding <peter@peterodding.com>
# Last Change: June 8, 2015
# URL: https://github.com/xolox/mopidy-simple-webclient

import os.path
import mopidy.config
import mopidy.ext

__version__ = '0.1.1'

class Extension(mopidy.ext.Extension):

    ext_name = 'simple-webclient'
    version = __version__

    def get_default_config(self):
        directory = os.path.dirname(os.path.abspath(__file__))
        return mopidy.config.read(os.path.join(directory, 'ext.conf'))

    def setup(self, registry):
        directory = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
        registry.add('http:static', dict(name=self.ext_name, path=directory))
