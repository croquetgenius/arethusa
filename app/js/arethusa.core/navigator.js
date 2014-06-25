'use strict';
angular.module('arethusa.core').service('navigator', [
  '$injector',
  'configurator',
  '$cacheFactory',
  function ($injector, configurator, $cacheFactory) {
    var self = this;
    this.sentences = [];
    this.sentencesById = {};
    this.currentPosition = 0;
    this.status = {};

    var citeMapper = configurator.provideResource('citeMapper');

    this.state = function () {
      if (!self.lazyState) {
        self.lazyState = $injector.get('state');
      }
      return self.lazyState;
    };

    this.addSentences = function(sentences) {
      arethusaUtil.pushAll(self.sentences, sentences);
      angular.forEach(sentences, function(sentence, i) {
        self.sentencesById[sentence.id] = sentence;
      });
    };

    var currentId = function () {
      return currentSentenceObj().id;
    };
    var currentSentenceObj = function () {
      return self.sentences[self.currentPosition] || {};
    };
    this.currentSentence = function () {
      return currentSentenceObj().tokens;
    };

    this.nextSentence = function () {
      if (self.hasNext()) movePosition(1);
    };
    this.prevSentence = function () {
      if (self.hasPrev()) movePosition(-1);
    };

    this.hasNext = function() {
      return self.currentPosition < self.sentences.length - 1;
    };
    this.hasPrev = function() {
      return self.currentPosition > 0;
    };

    this.goToFirst = function() {
      self.currentPosition = 0;
      self.updateState();
    };

    function findSentence(id) {
      var res;
      for (var i = self.sentences.length - 1; i >= 0; i--){
        if (self.sentences[i].id === id) {
          res = self.sentences[i];
          break;
        }
      }
      return res;
    }

    this.goTo = function(id) {
      var s = findSentence(id);
      if (s) {
        var i = self.sentences.indexOf(s);
        self.currentPosition = i;
        self.updateState();
      } else {
        // Not totally sure what we want to do here -
        //  maybe add a notification?

        /* global alert */

        alert('No sentence with id ' + id + ' found');
      }
    };

    this.goToLast = function() {
      self.currentPosition = self.sentences.length - 1;
      self.updateState();
    };

    var citationCache = $cacheFactory('citation', { number: 100 });
    function getCitation() {
      resetCitation();
      if (!citeMapper) return;

      var citation;
      var cite = currentSentenceObj().cite;
      if (cite) {
        citation = citationCache.get(cite);
        if (! citation) {
          citeMapper.get({ cite: cite}).then(function(res) {
            citation = res.data;
            citationCache.put(cite, citation);
            storeCitation(citation);
          });
        } else {
          storeCitation(citation);
        }
      }
    }

    function resetCitation() {
      delete self.status.citation;
    }

    function storeCitation(citation) {
      self.status.citation = citationToString(citation);
    }

    function citationToString(citation) {
      return arethusaUtil.inject([], citation, function(memo, key, val) {
        memo.push(val);
      }).join(' ');
    }

    this.updateState = function() {
      self.state().replaceState(self.currentSentence());
      self.updateId();
    };

    function movePosition(steps) {
      self.currentPosition += steps;
      self.updateState();
    }

    function updateNextAndPrev() {
      self.status.hasNext = self.hasNext();
      self.status.hasPrev = self.hasPrev();
    }

    this.updateId = function () {
      self.status.currentId = currentId();
      updateNextAndPrev();
      getCitation();
    };

    this.sentenceToString = function(sentence) {
      return arethusaUtil.inject([], sentence.tokens, function(memo, id, token) {
        memo.push(token.string);
      }).join(' ');
    };

    this.editor = function() {
      return angular.element(document.getElementById('arethusa-editor'));
    };

    this.list = function() {
      return angular.element(document.getElementById('arethusa-sentence-list'));
    };

    this.switchView = function() {
      var editor = self.editor();
      var list   = self.list();
      if (self.listMode) {
        editor.removeClass('hide');
        list.addClass('hide');
        self.listMode = false;
      } else {
        editor.addClass('hide');
        list.removeClass('hide');
        self.listMode = true;
      }
    };

    this.reset = function () {
      self.currentPosition = 0;
      self.sentences = [];
      self.sentencesById = {};
      self.listMode = false;
      self.hasList  = false;
      self.updateId();
    };
  }
]);
