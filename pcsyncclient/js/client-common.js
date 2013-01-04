/**
 * UI infrastructure code and utility code for the gaia pcsyncclient app.
 **/
var mozL10n = navigator.mozL10n;

var supNodes;

/**
 * Execute the async functions
 * The functions must call the given callback functions when executed.
 */
function syncExecuteAsyncFuncs(asyncFuncs, onFinished){
  if (asyncFuncs.length == 0) {
    onFinished();
  }

  function execAsyncFunc(func) {
    func(function async_callback() {
      if (asyncFuncs.length > 0) {
        execAsyncFunc(asyncFuncs.shift());
      } else {
        onFinished();
      }
    });
  }
  execAsyncFunc(asyncFuncs.shift());
}

function processTemplNodes(prefix) {
  var holder = document.getElementById('templ-' + prefix),
      nodes = {},
      node = holder.firstElementChild,
      reInvariant = new RegExp('^' + prefix + '-');
  while (node) {
    var classes = node.classList, found = false;
    for (var i = 0; i < classes.length; i++) {
      if (reInvariant.test(classes[i])) {
        var name = classes[i].substring(prefix.length + 1);
        nodes[name] = node;
        found = true;
        break;
      }
    }
    if (!found) {
      console.warn('Bad template node for prefix "' + prefix +
                   '" for node with classes:', classes);
    }

    node = node.nextElementSibling;
  }

  return nodes;
}
function populateTemplateNodes() {
  supNodes = processTemplNodes('sup');
}

function addClass(domNode, name) {
  if (domNode) {
    domNode.classList.add(name);
  }
}

function removeClass(domNode, name) {
  if (domNode) {
    domNode.classList.remove(name);
  }
}

/**
 * Add an event listener on a container that, when an event is encounted on
 * a descendant, walks up the tree to find the immediate child of the container
 * and tells us what the click was on.
 */
function bindContainerHandler(containerNode, eventName, func) {
  containerNode.addEventListener(eventName, function(event) {
    var node = event.target;
    // bail if they clicked on the container and not a child...
    if (node === containerNode)
      return;
    while (node && node.parentNode !== containerNode) {
      node = node.parentNode;
    }
    func(node, event);
  }, false);
}

var Cards = {
  _cardDefs: {},
  _cardStack: [],
  activeCardIndex: -1,
  _zIndex: 0,
  _rootNode: null,
  _containerNode: null,
  _cardsNode: null,
  _templateNodes: null,
  _animatingDeadDomNodes: [],
  _transitionCount: 0,
  _suppressClick: false,
  _trayActive: false,
  _popupActive: null,
  _eatingEventsUntilNextCard: false,
  TRAY_GUTTER_WIDTH: 60,

  _init: function() {
    this._rootNode = document.body;
    this._containerNode = document.getElementById('cardContainer');
    this._cardsNode = document.getElementById('cards');
    this._templateNodes = processTemplNodes('card');

    this._containerNode.addEventListener('click',
                                         this._onMaybeIntercept.bind(this),
                                         true);
    this._containerNode.addEventListener('contextmenu',
                                         this._onMaybeIntercept.bind(this),
                                         true);

    // XXX be more platform detecty. or just add more events. unless the
    // prefixes are already gone with webkit and opera?
    this._cardsNode.addEventListener('transitionend',
                                     this._onTransitionEnd.bind(this),
                                     false);
  },

  _onMaybeIntercept: function(event) {
    // Contextmenu-derived click suppression wants to gobble an explicitly
    // expected event, and so takes priority over other types of suppression.
    
    if (event.type === 'click' && this._suppressClick) {
      this._suppressClick = false;
      event.stopPropagation();
      return;
    }
    if (this._eatingEventsUntilNextCard) {
      event.stopPropagation();
      return;
    }
    if (this._popupActive) {
      event.stopPropagation();
      this._popupActive.close();
      return;
    }
    if (this._trayActive &&
        (event.clientX >
         this._containerNode.offsetWidth - this.TRAY_GUTTER_WIDTH)) {
      event.stopPropagation();
      this.moveToCard(this.activeCardIndex + 1, 'animate', 'forward');
    }
  },

  defineCard: function(cardDef) {
    if (!cardDef.name)
      throw new Error('The card type needs a name');
    if (this._cardDefs.hasOwnProperty(cardDef.name))
      throw new Error('Duplicate card name: ' + cardDef.name);
    this._cardDefs[cardDef.name] = cardDef;

    // normalize the modes
    for (var modeName in cardDef.modes) {
      var mode = cardDef.modes[modeName];
      if (!mode.hasOwnProperty('tray'))
        mode.tray = false;
      mode.name = modeName;
    }
  },

  defineCardWithDefaultMode: function(name, defaultMode, constructor) {
    var cardDef = {
      name: name,
      modes: {},
      constructor: constructor
    };
    cardDef.modes['default'] = defaultMode;
    this.defineCard(cardDef);
  },

  pushCard: function(type, mode, showMethod, args, placement) {
    var cardDef = this._cardDefs[type];
    if (!cardDef)
      throw new Error('No such card def type: ' + type);
    var modeDef = cardDef.modes[mode];
    if (!modeDef)
      throw new Error('No such card mode: ' + mode);

    var domNode = this._templateNodes[type].cloneNode(true);

    var cardImpl = new cardDef.constructor(domNode, mode, args);
    var cardInst = {
      domNode: domNode,
      cardDef: cardDef,
      modeDef: modeDef,
      cardImpl: cardImpl
    };
    var cardIndex, insertBuddy;
    if (!placement) {
      cardIndex = this._cardStack.length;
      insertBuddy = null;
      domNode.classList.add(cardIndex === 0 ? 'before': 'after');
    }
    else if (placement === 'left') {
      cardIndex = this.activeCardIndex++;
      insertBuddy = this._cardsNode.children[cardIndex];
      domNode.classList.add('before');
    }
    else if (placement === 'right') {
      cardIndex = this.activeCardIndex + 1;
      if (cardIndex >= this._cardStack.length)
        insertBuddy = null;
      else
        insertBuddy = this._cardsNode.children[cardIndex];
      domNode.classList.add('after');
    }
    this._cardStack.splice(cardIndex, 0, cardInst);
    this._cardsNode.insertBefore(domNode, insertBuddy);
    if ('postInsert' in cardImpl)
      cardImpl.postInsert();

    if (showMethod !== 'none') {
      // make sure the reflow sees the new node so that the animation
      // later is smooth.
      domNode.clientWidth;

      this._showCard(cardIndex, showMethod, 'forward');
    }
  },

  _findCardUsingTypeAndMode: function(type, mode) {
    for (var i = 0; i < this._cardStack.length; i++) {
      var cardInst = this._cardStack[i];
      if (cardInst.cardDef.name === type &&
          cardInst.modeDef.name === mode) {
        return i;
      }
    }
    throw new Error('Unable to find card with type: ' + type + ' mode: ' +
                    mode);
  },

  _findCardUsingImpl: function(impl) {
    for (var i = 0; i < this._cardStack.length; i++) {
      var cardInst = this._cardStack[i];
      if (cardInst.cardImpl === impl)
        return i;
    }
    throw new Error('Unable to find card using impl:', impl);
  },

  _findCard: function(query) {
    if (Array.isArray(query))
      return this._findCardUsingTypeAndMode(query[0], query[1]);
    else if (typeof(query) === 'number') // index number
      return query;
    else
      return this._findCardUsingImpl(query);
  },

  findCardObject: function(query) {
    return this._cardStack[this._findCard(query)];
  },

  moveToCard: function(query, showMethod) {
    this._showCard(this._findCard(query), showMethod || 'animate');
  },

  removeCardAndSuccessors: function(cardDomNode, showMethod, numCards,
                                    nextCardSpec) {
										
    if (!this._cardStack.length)
      return;
	
    var firstIndex, iCard, cardInst;
    if (cardDomNode === undefined) {
      throw new Error('undefined is not a valid card spec!');
    }
    else if (cardDomNode === null) {
      firstIndex = 0;
    }
    else {
      for (iCard = this._cardStack.length - 1; iCard >= 0; iCard--) {
        cardInst = this._cardStack[iCard];
        if (cardInst.domNode === cardDomNode) {
          firstIndex = iCard;
          break;
        }
      }
      if (firstIndex === undefined)
        throw new Error('No card represented by that DOM node');
    }
    
    if (!numCards)
      numCards = this._cardStack.length - firstIndex;

    if (showMethod !== 'none') {
      var nextCardIndex = null;
      if (nextCardSpec)
        nextCardIndex = this._findCard(nextCardSpec);
      else if (this._cardStack.length)
        nextCardIndex = Math.min(firstIndex - 1, this._cardStack.length - 1);

      this._showCard(nextCardIndex, showMethod, 'back');
    }

    // Update activeCardIndex if nodes were removed that would affect its
    // value.
    if (firstIndex <= this.activeCardIndex) {
      this.activeCardIndex -= numCards;
      if (this.activeCardIndex < -1) {
        this.activeCardIndex = -1;
      }
    }

    var deadCardInsts = this._cardStack.splice(
                          firstIndex, numCards);
    for (iCard = 0; iCard < deadCardInsts.length; iCard++) {
      cardInst = deadCardInsts[iCard];
      try {
        cardInst.cardImpl.die();
      }
      catch (ex) {
        console.warn('Problem cleaning up card:', ex, '\n', ex.stack);
      }
      switch (showMethod) {
        case 'animate':
        case 'immediate': // XXX handle properly
          this._animatingDeadDomNodes.push(cardInst.domNode);
          break;
        case 'none':
          cardInst.domNode.parentNode.removeChild(cardInst.domNode);
          break;
      }
    }
  },

  _showCard: function(cardIndex, showMethod, navDirection) {
    // Do not do anything if this is a show card for the current card.
    if (cardIndex === this.activeCardIndex) {
      return;
    }
    if (cardIndex > this._cardStack.length - 1) {
      // Some cards were removed, adjust.
      cardIndex = this._cardStack.length - 1;
    }
    if (this.activeCardIndex > this._cardStack.length - 1) {
      this.activeCardIndex = -1;
    }
    if (this.activeCardIndex === -1) {
      this.activeCardIndex = cardIndex === 0 ? cardIndex : cardIndex - 1;
    }
    var cardInst = (cardIndex !== null) ? this._cardStack[cardIndex] : null;
    var beginNode = this._cardStack[this.activeCardIndex].domNode;
    var endNode = this._cardStack[cardIndex].domNode;
    var isForward = navDirection === 'forward';

    if (this._cardStack.length === 1) {
      // Reset zIndex so that it does not grow ever higher when all but
      // one card are removed
      this._zIndex = 0;
    }

    // If going forward and it is an overlay node, then do not animate the
    // beginning node, it will just sit under the overlay.
    if (isForward && endNode.classList.contains('anim-overlay')) {
      beginNode = null;

      // anim-overlays are the transitions to new layers in the stack. If
      // starting a new one, it is forward movement and needs a new zIndex.
      // Otherwise, going back to
      this._zIndex += 100;
    }

    // If going back and the beginning node was an overlay, do not animate
    // the end node, since it should just be hidden under the overlay.
    if (beginNode && beginNode.classList.contains('anim-overlay')) {
      if (isForward) {
        // If a forward animation and overlay had a vertical transition,
        // disable it, use normal horizontal transition.
        if (showMethod !== 'immediate' &&
            beginNode.classList.contains('anim-vertical')) {
          removeClass(beginNode, 'anim-vertical');
          addClass(beginNode, 'disabled-anim-vertical');
        }
      } else {
        endNode = null;
        this._zIndex -= 100;
      }
    }
    // If the zindex is not zero, then in an overlay stack, adjust zindex
    // accordingly.
    if (endNode && isForward && this._zIndex) {
      endNode.style.zIndex = this._zIndex;
    }

    var cardsNode = this._cardsNode;

    if (showMethod === 'immediate') {
      addClass(beginNode, 'no-anim');
      addClass(endNode, 'no-anim');

      // make sure the reflow sees the transition is turned off.
      cardsNode.clientWidth;
      // explicitly clear since there will be no animation
      this._eatingEventsUntilNextCard = false;
    }
    else {
      this._transitionCount = (beginNode && endNode) ? 2 : 1;
      this._eatingEventsUntilNextCard = true;
    }
    if (this.activeCardIndex === cardIndex) {
      // same node, no transition, just bootstrapping UI.
      removeClass(beginNode, 'before');
      removeClass(beginNode, 'after');
      addClass(beginNode, 'center');
    } else if (this.activeCardIndex > cardIndex) {
      // back
      removeClass(beginNode, 'center');
      addClass(beginNode, 'after');

      removeClass(endNode, 'before');
      addClass(endNode, 'center');
    } else {
      // forward
      removeClass(beginNode, 'center');
      addClass(beginNode, 'before');

      removeClass(endNode, 'after');
      addClass(endNode, 'center');
    }
    if (showMethod === 'immediate') {
      // make sure the instantaneous transition is seen before we turn
      // transitions back on.
      cardsNode.clientWidth;

      removeClass(beginNode, 'no-anim');
      removeClass(endNode, 'no-anim');
    }
    
    this.activeCardIndex = cardIndex;
    if (cardInst)
      this._trayActive = cardInst.modeDef.tray;
  },

  _onTransitionEnd: function(event) {
    // Multiple cards can animate, so there can be multiple transitionend
    // events. Only do the end work when all have finished animating.
    if (this._transitionCount > 0)
      this._transitionCount -= 1;

    if (this._transitionCount === 0) {
      if (this._eatingEventsUntilNextCard)
        this._eatingEventsUntilNextCard = false;
      if (this._animatingDeadDomNodes.length) {
        // Use a setTimeout to give the animation some space to settle.
        setTimeout(function () {
          this._animatingDeadDomNodes.forEach(function(domNode) {
            if (domNode.parentNode)
              domNode.parentNode.removeChild(domNode);
          });
          this._animatingDeadDomNodes = [];
        }.bind(this), 100);
      }

      // If an vertical overlay transition was was disabled, if
      // current node index is an overlay, enable it again.
      var endNode = this._cardStack[this.activeCardIndex].domNode;
      if (endNode.classList.contains('disabled-anim-vertical')) {
        removeClass(endNode, 'disabled-anim-vertical');
        addClass(endNode, 'anim-vertical');
      }
    }
  }
};
