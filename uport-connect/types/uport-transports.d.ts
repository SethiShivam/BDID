export namespace crypto {
  const ASYNC_ENC_ALGORITHM: string;
  function decryptMessage(_ref: any, secretKey: any): any;
  function decryptResponse(response: any, secretKey: any): any;
  function encryptMessage(message: any, boxPub: any): any;
  function pad(message: any): any;
  function randomString(length: any): any;
  function unpad(padded: any): any;
}
export const message: {
  util: {
    getURLJWT: Function;
    getUrlQueryParams: Function;
    isJWT: Function;
    messageToDeeplinkURI: Function;
    messageToURI: Function;
    messageToUniversalURI: Function;
    paramsToQueryString: Function;
    paramsToUrlFragment: Function;
  };
};
export const network: {
  config: {
    network: Function;
    networkSet: Function;
    networkToNetworkSet: Function;
  };
  defaults: {
    NETWORK: string;
    networks: {
      kovan: {
        id: any;
        registry: any;
        rpcUrl: any;
      };
      mainnet: {
        id: any;
        registry: any;
        rpcUrl: any;
      };
      rinkeby: {
        id: any;
        registry: any;
        rpcUrl: any;
      };
      ropsten: {
        id: any;
        registry: any;
        rpcUrl: any;
      };
    };
  };
};
export namespace transport {
  namespace messageServer {
    const CHASQUI_URL: string;
    function URIHandlerSend(uriHandler: any, ...args: any[]): any;
    function clearResponse(url: any): void;
    function genCallback(...args: any[]): any;
    function isMessageServerCallback(uri: any, ...args: any[]): any;
    function poll(url: any, pollingInterval: any, cancelled: any): any;
  }
  function poll(url: any, messageParse: any, errorParse: any, ...args: any[]): any;
  namespace push {
    function send(token: any, pubEncKey: any, ...args: any[]): any;
    function sendAndNotify(token: any, pubEncKey: any, ...args: any[]): any;
  }
  namespace qr {
    function chasquiCompress(message: any, ...args: any[]): any;
    function chasquiSend(...args: any[]): any;
    function send(displayText: any): any;
  }
  namespace ui {
    function askProvider(isTx: any): any;
    function close(): void;
    function failure(retry: any): void;
    function getImageDataURI(data: any): any;
    function notifyPushSent(fallback: any): void;
    function open(data: any, cancel: any, modalText: any): void;
    function spinner(...args: any[]): void;
    function success(...args: any[]): void;
  }
  namespace url {
    function getResponse(): any;
    function listenResponse(cb: any): void;
    function onResponse(): any;
    function parseResponse(url: any): any;
    function send(...args: any[]): any;
  }
}
