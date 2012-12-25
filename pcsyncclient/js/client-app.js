/**
 * Application logic that isn't specific to cards, specifically entailing
 * startup and eventually notifications.
 **/

var App = {
  /**
   * Bind any global notifications, relay localizations to the back-end.
   */
  _init: function() {
      Cards.pushCard(
        'pick-service', 'default', 'immediate',
        {
          allowBack: false
        });
  }
};

function hookStartup() {
  function doInit() {
    try {
      populateTemplateNodes();
      Cards._init();
      App._init();
    }
    catch (ex) {
      console.error('Problem initializing', ex, '\n', ex.stack);
    }
  }

  window.addEventListener('localized', function() {
    console.log('got localized!');
    doInit();
  }, false);

}

hookStartup();

var activityCallback = null;
if ('mozSetMessageHandler' in window.navigator) {
  window.navigator.mozSetMessageHandler('activity',
                                        function actHandle(activity) {});
}

window.addEventListener('unload', function(e) {
  Connection_internet.disconnectToServer();
}, false);
