Simple Mopidy webclient
=======================

The simple Mopidy webclient is an HTTP client for the `Mopidy music server`_
that's designed to be simple and minimalistic in an attempt to create a touch
friendly web interface that works in most (mobile) web browsers.

.. contents::

Introduction
------------

`Mopidy music server`_ is an awesome piece of software that provides a
headless_ music player compatible with the MPD_ protocol and is capable of
streaming music from Spotify_. I'm running Mopidy on two `Raspberry Pi`_
computers, one in my living room and one in my bedroom.

The only thing I was missing was a simple client with playback control, volume
control and playlist selection that would work on my smart phones, iPad and
laptops. Despite the plentitude of `HTTP clients`_ referenced in the Mopidy
documentation and the fact that `any MPD client`_ should work I didn't succeed
in finding a client that actually worked well for me on all of the mentioned
devices :-(

After wasting two days on my search for a simple Mopidy client that would Just
Work (TM) I decided to take up the Mopidy developers' promise that Mopidy is
easy to extend by developing my own web interface. It took three iterations to
build something I was happy with.

First iteration: Server side PHP
 The first proof of concept was a simple PHP_ script using Mopidy's `JSON-RPC
 API`_. Once I had playback control implemented I decided that writing PHP
 makes me sad so I switched to Python_ (and Flask) instead.

Second iteration: Server side Python
 The second proof of concept got a lot further than the first: I implemented
 playback control, volume control and playlist selection. While working on this
 implementation it began to dawn on me that a JavaScript client using
 asynchronous HTTP connections could be a lot more responsive than any server
 side implementation (and potentially simpler to boot).

Third iteration: Client side JavaScript
 JavaScript_ is not exactly my favorite language but the experience of writing
 a Mopidy web client wasn't all that bad. Once I had everything running I
 really appreciated the elegance of only needing HTML, CSS and JavaScript to
 build a simple but usable Mopidy client! I didn't even use Mopidy.js_ because
 I started out by porting Python code built on top of Mopidy's `JSON-RPC API`_.

Getting started
---------------

As mentioned in the introduction above the simple Mopidy webclient is a client
side JavaScript application. Despite this the client is published as a Python
package. This package contains the client side code plus the minimal amount of
glue (18 lines of Python code :-) needed to expose the client as a proper
Mopidy HTTP extension. The Python package is available on PyPI_ which means
it's very easy to install the client:

.. code-block:: bash

   $ sudo pip install Mopidy-Simple-Webclient

After installation you need to restart your Mopidy daemon to load the new
extension. I'm running Mopidy as a system daemon so I would use the following
command:

.. code-block:: bash

   $ sudo service mopidy restart

Accessing the web interface
~~~~~~~~~~~~~~~~~~~~~~~~~~~

Once you've installed the extension and restarted your Mopidy daemon, the
Mopidy web interface should look similar to this:

.. image:: https://github.com/xolox/mopidy-simple-webclient/raw/master/screenshots/getting-started.png
   :alt: Mopidy webserver start screen.

Click on the 'simple-webclient' link to open the simple Mopidy webclient.

The playlist selection interface
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The simple Mopidy webclient doesn't have a playlist / tracklist editing
interface and it also doesn't provide a way to browse your music collection.
Instead you are expected to create a playlist in a more full featured Mopidy
client or Spotify_ and select this playlist in the simple Mopidy web client.
Selecting a playlist looks similar to this:

.. image:: https://github.com/xolox/mopidy-simple-webclient/raw/master/screenshots/playlist-selection.png
   :alt: Playlist selection interface of the simple Mopidy webclient.

Please note that I've only been using Mopidy for a couple of days (at the time
I'm writing this) so I'm still getting to grips with how Mopidy works and this
means I've only tested the playlist selection interface with Spotify
playlists (not with local playlists).

The playback control interface
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Once the Mopidy track list (the 'current playlist') contains some tracks the
simple Mopidy webclient will switch to the playback control interface which
looks like this:

.. image:: https://github.com/xolox/mopidy-simple-webclient/raw/master/screenshots/playback-control.png
   :alt: Playback control interface of the simple Mopidy webclient.

Here's an explanation of the main elements in the playback control interface:

- At the top is the track title, followed by the album name and the artist(s).

- Below the track info are the playback control buttons. When nothing is
  playing this shows previous/play/next buttons. While a track is playing this
  shows previous/pause/stop/next buttons.

- The line of blue/grey dots is the volume control. HTML5_ has fancy slider
  controls for this but the web browser on my smartphone isn't fancy enough to
  support those so I created a simple touch friendly control instead.

- The button "Select playlist" brings you back to the playlist selection
  interface and the other other two buttons do what you would expect them to
  :-).

Future improvements
-------------------

Some ideas for if/when I find the time to continue work on this client:

Real time state changes
 It would be awesome to enable instant server → client notifications instead of
 a 10 second polling interval. It looks like this requires websockets. Not sure
 those will work on my smart phone. Even if they don't, maybe I can add
 optional support (graceful degradation)?

Enable cover art
 It's not yet clear to me how cover art works in Mopidy, but other clients can
 do it so I should be able to as well :-)

Enable server side configuration
 Mopidy's extension mechanism already forces me to use a configuration file, so
 why not add some useful options to that, like the ability to change the page
 title? This is not trivial because it would involve the first "server side"
 logic in this project (on the other hand that opens the door to
 functionality not available to pure JavaScript clients).

Upgrade jQuery/Bootstrap, bundle the files
 Right now jQuery_ and Bootstrap_ are loaded from the Google and Bootstrap CDNs
 but at some point the referenced versions will disappear from the web. Why not
 upgrade to the latest versions and bundle the files in the git repository and
 Python source distributions?

Contact
-------

The latest version of the simple Mopidy webclient is available on PyPI_ and
GitHub_. For bug reports please create an issue on GitHub_. If you have
questions, suggestions, etc. feel free to send me an e-mail at
`peter@peterodding.com`_.

License
-------

This software is licensed under the `MIT license`_.

© 2014 Peter Odding.

The simple Mopidy webclient uses the following projects:

`Mopidy music server`_
 Licensed under the Apache License, refer to the `Mopidy license`_ file.

jQuery_
 Licensed under the MIT license, refer to the `jQuery license`_ file.

Bootstrap_
 The version used is licensed under the Apache License, refer to the
 `Bootstrap license`_ file (newer versions are licensed under the MIT
 license).

sprintf.js_
 Licensed under the BSD license, refer to the `sprintf.js license`_ file (tip:
 I used what-license.com_ to identify the license :-).

`Humanity icon theme`_
 Licensed under the Creative Commons Attribution-ShareAlike 3.0 license, refer
 to the `Humanity license`_ file. It's not clear to me if using these icons
 with attribution and without alterations requires my work to be licensed
 under the same license as well (I'm hoping it doesn't, I'm afraid it does).
 If it turns out that this is true I'd rather find a different icon set
 because using CC BY-SA license for software doesn't make any sense.

.. External references:
.. _any MPD client: http://en.wikipedia.org/wiki/Music_Player_Daemon#Clients
.. _Bootstrap license: https://github.com/twbs/bootstrap/blob/v2.3.2/LICENSE
.. _Bootstrap: http://getbootstrap.com/
.. _GitHub: https://github.com/xolox/mopidy-simple-webclient
.. _headless: http://en.wikipedia.org/wiki/Headless_software
.. _HTML5: http://en.wikipedia.org/wiki/HTML5
.. _HTTP clients: https://docs.mopidy.com/en/latest/clients/http/
.. _Humanity icon theme: https://launchpad.net/human-icon-theme
.. _Humanity license: http://bazaar.launchpad.net/~ubuntu-art-pkg/human-icon-theme/ubuntu/view/head:/COPYING
.. _JavaScript: http://en.wikipedia.org/wiki/JavaScript
.. _jQuery license: https://github.com/jquery/jquery/blob/2.0.2/MIT-LICENSE.txt
.. _jQuery: http://jquery.com/
.. _JSON-RPC API: https://docs.mopidy.com/en/latest/api/http/#http-api
.. _MIT license: http://en.wikipedia.org/wiki/MIT_License
.. _Mopidy license: https://github.com/mopidy/mopidy/blob/develop/LICENSE
.. _Mopidy music server: https://www.mopidy.com/
.. _Mopidy.js: https://docs.mopidy.com/en/latest/api/js/#mopidy-js
.. _MPD: http://en.wikipedia.org/wiki/Music_Player_Daemon
.. _peter@peterodding.com: peter@peterodding.com
.. _PHP: http://en.wikipedia.org/wiki/PHP
.. _PyPI: https://pypi.python.org/pypi/Mopidy-Simple-Webclient
.. _Python: http://en.wikipedia.org/wiki/Python_(programming_language)
.. _Raspberry Pi: http://en.wikipedia.org/wiki/Raspberry_Pi
.. _Spotify: http://en.wikipedia.org/wiki/Spotify
.. _sprintf.js license: https://github.com/alexei/sprintf.js/blob/master/LICENSE
.. _sprintf.js: https://github.com/alexei/sprintf.js
.. _what-license.com: http://www.what-license.com/
