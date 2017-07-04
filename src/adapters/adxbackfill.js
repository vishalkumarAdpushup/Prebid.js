/*jshint loopfunc: true */

var bidfactory = require('../bidfactory.js');
var bidmanager = require('../bidmanager.js');
var utils = require('../utils.js');

const adxBackFill = '<script async src="//pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script><ins class="adsbygoogle" style="display:inline-block;width:__SIZE_W__px;height:__SIZE_H__px" data-ad-client="ca-pub-8933329999391104" data-ad-slot="HB_FALLBACK"></ins><script>(adsbygoogle=window.adsbygoogle || []).push({});</script>'
const defaultCPM = 0.01;

var adxBackFillAdapter = function adxBackFillAdapter() {
  function setBackFillCreative(bidRequest,paramObj){
      var bidObject = bidfactory.createBid(1);
      bidObject.bidderCode = bidRequest.bidder;
      bidObject.cpm = defaultCPM;
      bidObject.ad = utils.replaceTokenInString(adxBackFill, paramObj, '__');
      bidObject.width = paramObj.SIZE_W;
      bidObject.height = paramObj.SIZE_H;
      

      bidmanager.addBidResponse(bidRequest.placementCode, bidObject);
  }

  function _callBids(params) {
    var bids = params.bids || [];

    utils._each(bids, function (bid) {
      var paramObj = {};
      paramObj.TS = +(new Date());
      paramObj.TRANSACTION_ID = encodeURIComponent(bid.requestId);

      if (Array.isArray(bid.sizes[0])) {
        paramObj.SIZE_W = bid.sizes[0][0];
        paramObj.SIZE_H = bid.sizes[0][1];
      } else {
        paramObj.SIZE_W = bid.sizes[0];
        paramObj.SIZE_H = bid.sizes[1];
      }

      setBackFillCreative(bid,paramObj)

    });
  }

  return {
    callBids: _callBids
  };
};

module.exports = adxBackFillAdapter;
