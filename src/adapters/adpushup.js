/*jshint loopfunc: true */

var bidfactory = require('../bidfactory.js');
var bidmanager = require('../bidmanager.js');
var utils = require('../utils.js');

const serverHostname = '//s2s.adpushup.com';
const serverString = '/AdWebService/ads?section=__SECTION__&source=1&pos=__POSITION__&ref=__REFERRER__&packetId=__PACKET_ID__&blockAnimation=__BLOCK_ANIMATION__&siteId=__SITE_ID__' +
  '&bidFloor=__BID_FLOOR__&page=__SITE_URL__&w=__SIZE_W__&h=__SIZE_H__&tid=__TRANSACTION_ID__' +
  '&pchain=__PCHAIN__&ts=__TS__';

const defaultBidFloor = 0.0;

window.jsonPLoad = function ( url, callback, paramName ) {
    var self        = window.jsonPLoad,                                          // this function
        queue       = self.queue || ( self.queue = {} ),                         // callback queue
        name        = 'jsonPLoad' + Object.keys( queue ).length  + '_' + Date.now(), // unique callback name
        global      = 'jsonPLoad.queue.' + name,                                     // global callback name
        placeholder = /(=)\?(?=&|$)/,                                           // placeholder pattern
        script      = document.createElement( 'script' )                        // script dom node
    ;
    script.type = 'text/javascript';
    script.src  = placeholder.test( url ) ?
        url.replace( placeholder, '$1' + global ) :
        url + ( /\?/.test(url) ? '&' : '?' ) + ( paramName || 'callback' ) + '=' + global
    ;
    script.onload             = function () {
        delete queue[name];
    };
    script.onreadystatechange = function() { // IE sucks
        if( this.readyState === 'complete' ){
          this.onload();
        }
    };
    queue[name] = callback;
    ( document.getElementsByTagName('head')[0] || document.documentElement ).appendChild( script );
};

var adpushupAdapter = function adpushupAdapter() {
  function bidResponseHandler( bidRequest, adSize, _bidResponse ){

    var bidResponse = _bidResponse.creativeList[0],
      bidObject;

    if(bidResponse && bidResponse.price > 0 && !!bidResponse.adm){
      bidObject = bidfactory.createBid(1);
      bidObject.bidderCode = bidRequest.bidder;
      bidObject.cpm = parseFloat(bidResponse.price);
      bidObject.ad = bidResponse.adm;
      bidObject.creativeType = bidResponse.creativeQaAdType;
      bidObject.width = bidResponse.width || adSize[0];
      bidObject.height = bidResponse.height || adSize[1];
    } else {
      bidObject = bidfactory.createBid(2);
      bidObject.bidderCode = bidRequest.bidder;
      utils.logMessage('No prebid response from Admedia for placement code ' + bidRequest.placementCode);
    }

    bidmanager.addBidResponse(bidRequest.placementCode, bidObject);

  }

  function makeBidRequest(paramObj, bidRequestObj, adSize){
    var biddingUrl;

    try{
      biddingUrl =  utils.replaceTokenInString( serverHostname + serverString, paramObj, '__');
    } catch(e) {
      console.log(e);
    }

    window.jsonPLoad(biddingUrl, bidResponseHandler.bind(this, bidRequestObj, adSize));
  }

  function _callBids(params) {
    var bids    = params.bids || [];
        //locUrl  = utils.getTopWindowUrl();

    utils._each(bids, function(bid) {
      var paramObj = {};

      paramObj.REFERRER = encodeURIComponent(document.referrer);
      paramObj.PACKET_ID = encodeURIComponent(utils.getUUID(bid.params.siteId));
      paramObj.SITE_ID = bid.params.siteId;
      paramObj.SECTION = bid.params.section;
      paramObj.POSITION = 0;
      paramObj.PCHAIN = 0;
      paramObj.TS = +(new Date());
      paramObj.TRANSACTION_ID = encodeURIComponent(bid.requestId);
      paramObj.BID_FLOOR = bid.params.bidFloor || defaultBidFloor;
      paramObj.BLOCK_ANIMATION = bid.params.blockAnimation || false;
      paramObj.SITE_URL = bid.params.page;

      if( Array.isArray(bid.sizes[0]) ) {
        paramObj.SIZE_W = bid.sizes[0][0];
        paramObj.SIZE_H = bid.sizes[0][1];
      } else {
        paramObj.SIZE_W = bid.sizes[0];
        paramObj.SIZE_H = bid.sizes[1];
      }

      makeBidRequest(paramObj, bid, [paramObj.SIZE_W, paramObj.SIZE_H]);

    });
  }

  return {
    callBids: _callBids
  };
};

module.exports = adpushupAdapter;
