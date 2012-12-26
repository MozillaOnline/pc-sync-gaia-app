'use strict';

var PCSYNCCLIENT_SERVICES = [
  {
    name: 'Internet Connection',
    l10nId: 'connection-internet',
    domain: 'ws://10.241.5.232:8888/dws'
  },
  {
    name: 'Lan Connection',
    l10nId: 'connection-lan',
    domain: 'IP address'
  },
  {
    name: 'USB Connection',
    l10nId: 'connection-usb',
    domain: 'ws://10.241.5.232:8888/dws',
    hideDisplayCard: true
  }
];

function SetupPickServiceCard(domNode, mode, args) {
  this.domNode = domNode;

  if (args.allowBack) {
    var backButton = domNode.getElementsByClassName('sup-back-btn')[0];
    backButton.addEventListener('click', this.onBack.bind(this), false);
    backButton.classList.remove('collapsed');
  }

  this.servicesContainer =
    domNode.getElementsByClassName('sup-services-container')[0];
  bindContainerHandler(this.servicesContainer, 'click',
                       this.onServiceClick.bind(this));

  this._populateServices();
}
SetupPickServiceCard.prototype = {
  _populateServices: function() {
    for (var i = 0; i < PCSYNCCLIENT_SERVICES.length; i++) {
      var serviceDef = PCSYNCCLIENT_SERVICES[i],
          serviceNode = supNodes['service-choice'].cloneNode(true),
          serviceLabel =
            serviceNode.getElementsByClassName('sup-service-choice-label')[0];

      if (serviceDef.l10nId)
        serviceLabel.textContent = mozL10n.get(serviceDef.l10nId);
      else
        serviceLabel.textContent = serviceDef.name;
      serviceNode.serviceDef = serviceDef;

      this.servicesContainer.appendChild(serviceNode);
    }
  },

  onBack: function(event) {
    Cards.removeCardAndSuccessors(null, 'none');
  },

  onServiceClick: function(serviceNode, event) {
    var serviceDef = serviceNode.serviceDef;
    if(serviceDef.hideDisplayCard){
		Cards.pushCard(
		'setup-progress', 'default', 'animate',
		{
			serverUrl: serviceDef.domain,
			isUsb: true
			
		});
	}
	else{
		Cards.pushCard(
		'setup-account-info', 'default', 'animate',
		{
			serviceDef: serviceDef
		});
	}
    
  },

  die: function() {
  }
};
Cards.defineCardWithDefaultMode(
    'pick-service',
     { tray: false },
    SetupPickServiceCard
);

function SetupAccountInfoCard(domNode, mode, args) {
  this.domNode = domNode;

  var backButton = domNode.getElementsByClassName('sup-back-btn')[0];
  backButton.addEventListener('click', this.onBack.bind(this), false);

  this.nextButton = domNode.getElementsByClassName('sup-info-next-btn')[0];
  this.nextButton.addEventListener('click', this.onNext.bind(this), false);

  this.nameNode = this.domNode.getElementsByClassName('sup-server-url')[0];
  this.nameNode.setAttribute('placeholder',
                             mozL10n.get('server-url-placeholder'));
  if (args.serviceDef.hideDisplayCard){
    this.nameNode.classList.add('collapsed');
  }
  this.nameNode.value = args.serviceDef.domain;
  this.nameNode.addEventListener('input', this.onInfoInput.bind(this));
  
  this.nextButton.disabled = false;
}
SetupAccountInfoCard.prototype = {
  onBack: function(event) {
	  
    Cards.removeCardAndSuccessors(this.domNode, 'animate');
  },
  onNext: function(event) {
    var nameNode = this.domNode.getElementsByClassName('sup-server-url')[0];

    Cards.pushCard(
      'setup-progress', 'default', 'animate',
      {
        serverUrl: this.nameNode.value,
        isUsb: false
      });
  },
  onInfoInput: function(event) {
    var nameValid = this.nameNode.classList.contains('collapsed') ||
                    this.nameNode.checkValidity();
  },
  die: function() {
  }
};
Cards.defineCardWithDefaultMode(
    'setup-account-info',
    { tray: false },
    SetupAccountInfoCard
);

function SetupProgressCard(domNode, mode, args) {
  this.domNode = domNode;
  this.args = args;

  var backButton = domNode.getElementsByClassName('sup-back-btn')[0];
  backButton.addEventListener('click', this.onBack.bind(this), false);

  var reconnection = domNode.getElementsByClassName('select-reconnection-btn')[0];
  reconnection.addEventListener('click', this.onReconnection.bind(this),
                                false);

  var self = this;
  this.creationInProcess = true;
  if(args.isUsb){
	  Connection_usb.createSocketserver(function(err) {
		  self.creationInProcess = false;
		  if (err){
			  self.onCreationError(err);
		  }
		  else{
			  self.onCreationSuccess();
		  }
	  });
  }
  else{
	  Connection_internet.connectToServer(args.serverUrl, 
		function(err) {
		  self.creationInProcess = false;
		  if (err){
			  self.onCreationError(err);
		  }
		  else{
			  self.onCreationSuccess();
		  }
	  });
  }
}
SetupProgressCard.prototype = {
  cancelCreation: function() {
    if (!this.creationInProcess)
      return;
  },

  onBack: function() {
    this.cancelCreation();
    Cards.removeCardAndSuccessors(this.domNode, 'animate');
  },

  onReconnection: function() {
    Cards.removeCardAndSuccessors(null, 'none');
    Cards.pushCard(
      'pick-service', 'default', 'immediate',
      {
        allowBack: true
      });
  },

  onCreationError: function(err) {
	  
    this.domNode.getElementsByClassName('sup-progress-region')[0]
        .classList.add('collapsed');
    this.domNode.getElementsByClassName('sup-error-region')[0]
        .classList.remove('collapsed');
    var errorMessageNode =
      this.domNode.getElementsByClassName('sup-error-message')[0];

    var unknownErrorStr = mozL10n.get('error-unknown');
    var errorStr = mozL10n.get('error-' + err, null, unknownErrorStr);
    errorMessageNode.textContent = errorStr;
  },

  onCreationSuccess: function() {
    Cards.removeCardAndSuccessors(null, 'none');
    Cards.pushCard(
      'setup-done', 'default', 'immediate',
      {});
  },

  die: function() {
    this.cancelCreation();
  }
};
Cards.defineCardWithDefaultMode(
    'setup-progress',
    { tray: false },
    SetupProgressCard
);

function ConnectionDoneCard(domNode, mode, args) {
  domNode.getElementsByClassName('select-another-connection-btn')[0]
    .addEventListener('click', this.onConnectAnother.bind(this), false);
  domNode.getElementsByClassName('app-exit-btn')[0]
    .addEventListener('click', this.onDisconnectServer.bind(this), false);
}
ConnectionDoneCard.prototype = {
  onConnectAnother: function() {
    Connection_internet.disconnectToServer();
    Cards.removeCardAndSuccessors(null, 'none');
    Cards.pushCard(
      'pick-service', 'default', 'immediate',
      {
        allowBack: true
      });
  },
  onDisconnectServer: function() {
    // Nuke this card
    Connection_internet.disconnectToServer();
    Cards.removeCardAndSuccessors(null, 'none');
    window.close();
  },

  die: function() {
  }
};
Cards.defineCardWithDefaultMode(
    'setup-done',
    { tray: false },
    ConnectionDoneCard
);

