/* Simple Mopidy web client.
 *
 * Author: Peter Odding <peter@peterodding.com>
 * Last Change: October 19, 2014
 * URL: https://github.com/xolox/mopidy-simple-webclient
 */

// Initialize the Mopidy client after all resources have been loaded.
$(function() {
  mopidy_client = new MopidyClient();
});

// MopidyClient {{{1

function MopidyClient() {
  this.init();
  return this;
};

// MopidyClient.init() - Initialize the Mopidy client. {{{2

MopidyClient.prototype.init = function() {
  // Initialize a logging handler for structured logging messages.
  this.logger = new Logger();
  this.logger.info("Initializing Mopidy client ..");
  // Track the connection state.
  this.connected = false;
  // Use an incrementing integer to uniquely identify JSON RPC calls.
  this.id = 1;
  // Enable tweaks for mobile devices.
  this.enable_mobile_tweaks();
  // Install global event handlers.
  this.install_event_handlers();
  // Ask the user which Mopidy server to connect to.
  this.select_server();
};

// MopidyClient.enable_mobile_tweaks() {{{2

MopidyClient.prototype.enable_mobile_tweaks = function() {
  if (navigator.userAgent.match(/mobile/i)) {
    $('body').addClass('mobile');
  }
};

// MopidyClient.install_event_handlers() {{{2

MopidyClient.prototype.install_event_handlers = function() {
  var client = this;
  $('#select-server form').submit(function() { client.connect($('#server-url').val()); return false; });
  $('#play-button').click(function() { client.play(); });
  $('#pause-button').click(function() { client.pause(); });
  $('#stop-button').click(function() { client.stop(); });
  $('#previous-track-button').click(function() { client.previous_track(); });
  $('#next-track-button').click(function() { client.next_track(); });
  $('#toggle-shuffle-button').click(function() { client.toggle_shuffle(); });
  $('#toggle-repeat-button').click(function() { client.toggle_repeat(); });
  $('#select-playlist-button').click(function() { client.select_playlist(); });
  $('#cancel-playlist-selection-button').click(function() { client.show_now_playing(); });
};

// MopidyClient.select_server() - Ask the user which Mopidy server to connect to. {{{2

MopidyClient.prototype.select_server = function() {
  // Pre fill the Mopidy server's base URL. This logic is intended to support
  // 1) Mopidy running on a separate domain and 2) Mopidy running on a specific
  // URL prefix.
  var url = document.location.href;
  // Remove fragment identifiers from the URL.
  url = url.replace(/#.*$/, '');
  // Remove an optional (redundant) filename from the URL.
  url = url.replace(/index\.html$/, '');
  // Remove the extension name from the URL.
  url = url.replace(/\/simple-webclient\/$/, '/');
  // Pre fill the form field.
  $('#server-url').val(url);
  // Try to connect automatically.
  this.logger.info("Trying to connect automatically ..");
  $('#select-server form').submit();
};

// MopidyClient.error_handler() {{{2

MopidyClient.prototype.error_handler = function(e) {
  this.logger.error("Exception handler called! (%s)", e);
  if (!this.connected) {
    this.show('select-server');
    $('#connect-error').html(sprintf("<strong>Error:</strong> Failed to connect to <code>%s</code>", this.base_url));
  } else {
    $('#runtime-error').html(sprintf("<strong>Warning:</strong> Encountered unhandled error! (review the console log for details)"));
    $('#runtime-error').show();
    console.log(e);
  }
};

// MopidyClient.connect() - Connect to the Mopidy server. {{{2

MopidyClient.prototype.connect = function(base_url) {
  // Store the Mopidy server base URL.
  this.base_url = base_url;
  // If the user entered a URL without a scheme we'll default to the http:// scheme.
  if (!this.base_url.match(/^\w+:/))
    this.base_url = 'http://' + this.base_url;
  this.logger.debug("Mopidy server base URL is " + this.base_url);
  // Concatenate the base URL and the /mopidy/rpc/ path.
  this.rpc_url = this.base_url.replace(/\/*$/, '/mopidy/rpc');
  this.logger.debug("Mopidy server RPC URL is " + this.rpc_url);
  // Switch to the `now playing' interface.
  this.show_now_playing();
};

// MopidyClient.show_now_playing() {{{2

MopidyClient.prototype.show_now_playing = function() {
  this.show('now-playing');
  this.refresh_gui();
};

// MopidyClient.refresh_gui() - Refresh the GUI. {{{2

var gui_refresh_interval = null;

MopidyClient.prototype.refresh_gui = function() {
  if (document.location.hash == '#now-playing') {
    this.call('core.playback.get_current_track', function(current_track) {
      if (!current_track) {
        this.logger.info("Nothing is currently playing, starting play list selection ..");
        this.select_playlist();
      } else {
        this.render_current_track(current_track);
      }
    });
  }
  if (gui_refresh_interval != null)
    clearTimeout(gui_refresh_interval);
  gui_refresh_interval = setTimeout(function() {
    mopidy_client.refresh_gui();
  }, 10000);
};

// MopidyClient.select_playlist() - Ask the user which play list to load. {{{2

MopidyClient.prototype.select_playlist = function() {
  // Show the play list selection interface.
  $('#available-playlists').hide();
  $('#no-playlists-message').hide();
  this.show('select-playlist');
  $('#loading-playlists-spinner').show();
  // Fetch the available play lists from the server.
  this.call('core.playlists.get_playlists', function(playlists) {
    this.logger.info("Found %i play lists.", playlists.length);
    var labels = [];
    for (var i = 0; i < playlists.length; i++) {
      var name = playlists[i].name;
      var size = playlists[i].tracks.length;
      var classes = 'btn btn-large';
      if (name == 'Starred')
        classes += ' btn-primary';
      var onclick = sprintf('mopidy_client.load_playlist(%s)', JSON.stringify(name));
      labels.push(sprintf('<button class="%s" onclick="%s">%s (%i tracks)</button>',
                          classes, html_encode(onclick), html_encode(name), size));
    }
    if (labels.length > 0) {
      $('#loading-playlists-spinner').hide();
      $('#available-playlists').html(labels.join('\n'));
      $('#available-playlists').show();
    } else {
      $('#loading-playlists-spinner').hide();
      $('#available-playlists').hide();
      $('#no-playlists-message').show();
    }
  });
};

// MopidyClient.load_playlist() - Load the selected play list. {{{2

MopidyClient.prototype.load_playlist = function(name) {
  // Fetch the available play lists from the server.
  this.call('core.playlists.get_playlists', function(playlists) {
    for (var i = 0; i < playlists.length; i++) {
      var playlist = playlists[i];
      // Match the selected play list by name.
      if (playlist.name == name) {
        // Clear all existing tracks from the track list.
        this.logger.debug("Clearing track list ..");
        this.call('core.tracklist.clear', function() {
          this.logger.debug("Adding tracks to track list ..");
          this.call({
            method: 'core.tracklist.add',
            params: [playlist.tracks],
            done: function() {
              this.call('core.playback.play', function() {
                this.show_now_playing();
              });
            }
          });
        });
        // Stop looking, we found the relevant play list.
        break;
      }
    }
  });
};

// MopidyClient.render_current_track() - Update the current track info. {{{2

MopidyClient.prototype.render_current_track = function(current_track) {
  this.logger.info("Rendering track information ..");
  // Show the now playing interface.
  this.show('now-playing');
  // Render the "$track from $album by $artist" text.
  var now_playing = [];
  now_playing.push(sprintf('<span class="track-name">%s</span><br>', this.link_to_spotify(current_track)));
  if (current_track.album && current_track.album.name != 'Unknown') {
    now_playing.push('<span class="from-album">from</span>');
    now_playing.push(sprintf('<span class="album-name">%s</span><br>', this.link_to_spotify(current_track.album)));
  }
  if (current_track.artists) {
    var artists = [];
    for (var i = 0; i < current_track.artists.length; i++) {
      var artist_name = this.link_to_spotify(current_track.artists[i]);
      artists.push(sprintf('<span class="artist-name">%s</span>', artist_name));
    }
    now_playing.push('<span class="by-artist">by</span>');
    now_playing.push(sprintf('%s', artists.join(', ')));
  }
  $('#track-info').html(now_playing.join('\n'));
  this.update_play_state();
}

// MopidyClient.update_play_state() {{{2

MopidyClient.prototype.update_play_state = function() {
  // Update the pause/resume toggle button.
  this.call('core.playback.get_state', function(state) {
    var button = $('#toggle-playback-button');
    if (state == 'playing') {
      $('#play-button').hide();
      $('#pause-button').show();
      $('#stop-button').show();
    } else {
      $('#play-button').show();
      $('#pause-button').hide();
      $('#stop-button').hide();
    }
  });
  // Update the shuffle toggle button.
  this.call('core.tracklist.get_random', function(enabled) {
    var label = $('#toggle-shuffle-button span');
    label.text(enabled ? "Disable shuffle" : "Enable shuffle");
  });
  // Update the repeat toggle button.
  this.call('core.tracklist.get_repeat', function(enabled) {
    var label = $('#toggle-repeat-button span');
    label.text(enabled ? "Disable repeat" : "Enable repeat");
  });
  // Update the volume level.
  this.call('core.playback.get_volume', function(volume_level) {
    var markers = $('#volume-control span');
    var step_size = 100 / markers.length;
    for (var i = 0; i < markers.length; i++)
      if ((i * step_size) <= volume_level)
        $(markers[i]).addClass('filled');
      else
        $(markers[i]).removeClass('filled');
  });
};

// MopidyClient.play() {{{2

MopidyClient.prototype.play = function() {
  // this.call('core.playback.resume');
  this.call('core.playback.play', this.update_play_state);
};

// MopidyClient.pause() {{{2

MopidyClient.prototype.pause = function() {
  this.call('core.playback.pause', this.update_play_state);
};

// MopidyClient.stop() {{{2

MopidyClient.prototype.stop = function() {
  this.call('core.playback.stop', this.update_play_state);
};

// MopidyClient.previous_track() {{{2

MopidyClient.prototype.previous_track = function() {
  this.call('core.playback.previous', function() {
    this.refresh_gui();
  });
};

// MopidyClient.next_track() {{{2

MopidyClient.prototype.next_track = function() {
  this.call('core.playback.next', function() {
    this.refresh_gui();
  });
};

// MopidyClient.toggle_shuffle() {{{2

MopidyClient.prototype.toggle_shuffle = function() {
  this.call('core.tracklist.get_random', function(enabled) {
    this.call({
      method: 'core.tracklist.set_random',
      params: [!enabled]
    });
    this.refresh_gui();
  });
};

// MopidyClient.toggle_repeat() {{{2

MopidyClient.prototype.toggle_repeat = function() {
  this.call('core.tracklist.get_repeat', function(enabled) {
    this.call({
      method: 'core.tracklist.set_repeat',
      params: [!enabled]
    });
    this.refresh_gui();
  });
};

// MopidyClient.set_volume() {{{2

MopidyClient.prototype.set_volume = function(volume_level) {
  this.call({method: 'core.playback.set_volume', params: [volume_level]});
  this.update_play_state();
};

// MopidyClient.show() - Bring the given interface to the front. {{{2

MopidyClient.prototype.show = function(element_id) {
  this.logger.info("Showing element with ID %s ..", element_id);
  $('.hidden-by-default').hide(0, function() {
    $(sprintf('#%s', element_id)).show(0);
  });
  document.location.href = sprintf('#%s', element_id);
};

// MopidyClient.link_to_spotify() - Generate hyper links to the Spotify web player. {{{2

MopidyClient.prototype.link_to_spotify = function (object) {
  var result = html_encode(object.name);
  if (object.uri) {
    var tokens = object.uri.split(':');
    if (tokens.length == 3 && tokens[0] == 'spotify') {
      var kind = tokens[1], identifier = tokens[2];
      result = sprintf('<a href="https://play.spotify.com/%s/%s">%s</a>', kind, identifier, result);
    }
  }
  return result;
};

// MopidyClient.call() - Call Mopidy API methods using JSON RPC. {{{2

MopidyClient.prototype.call = function() {
  // Unpack the arguments.
  if (arguments.length == 2) {
    var method = arguments[0];
    var params = [];
    var callback = arguments[1];
  } else {
    var settings = arguments[0];
    var method = settings.method;
    var params = settings.params || [];
    var callback = settings.done;
  }
  // Generate a unique id for this call.
  var request_id = this.id;
  this.id += 1;
  // Generate the JSON request body.
  var request_body = JSON.stringify({
    jsonrpc: '2.0',
    method: method,
    params: params,
    id: request_id
  });
  this.logger.debug("Generated request body: %s", request_body);
  // Make the call.
  this.logger.debug("Sending request ..");
  jQuery.ajax({
    url: this.rpc_url,
    type: 'POST',
    data: request_body
  }).done(function(data) {
    mopidy_client.connected = true;
    if (data.error) {
      console.log(data);
      throw "Mopidy API reported error: " + data.error.data;
    } else if (data.id != request_id) {
      throw "Response id " + data.id + " doesn't match request id " + request_id + "!";
    }
    if (callback)
      jQuery.proxy(callback, mopidy_client)(data.result);
  }).error(function(e) {
    mopidy_client.error_handler(e);
  });
};

// Logger {{{1

function Logger() {
  return this;
};

// Logger.log() {{{2

Logger.prototype.log = function(severity, args) {
  // Get the current date and time.
  var now = new Date();
  var timestamp = sprintf(
    '%i-%02d-%02d %02d:%02d:%02d',
    now.getFullYear(), now.getMonth(), now.getDate(),
    now.getHours(), now.getMinutes(), now.getSeconds()
  );
  // Render the log message.
  var message = sprintf.apply(null, args);
  console.log(timestamp + ' ' + severity + ' ' + message);
};

// Logger.error() {{{2

Logger.prototype.error = function() {
  this.log('ERROR', arguments);
};

// Logger.warning() {{{2

Logger.prototype.warning = function() {
  this.log('WARN', arguments);
};

// Logger.info() {{{2

Logger.prototype.info = function() {
  this.log('INFO', arguments);
};

// Logger.debug() {{{2

Logger.prototype.debug = function() {
  this.log('DEBUG', arguments);
};

// Miscellaneous functions. {{{1

// html_encode(string) {{{2

function html_encode(string) {
    return string.replace(/&/g, '&amp;')
                 .replace(/"/g, '&quot;')
                 .replace(/'/g, '&#39;')
                 .replace(/</g, '&lt;')
                 .replace(/>/g, '&gt;');
};
