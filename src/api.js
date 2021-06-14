export const BASE_URL = "https://min-api.cryptocompare.com/";
const WS_BASE_URL =
  "wss://streamer.cryptocompare.com/v2?api_key=d8526ea0119503cd855334ae2503cba6c012e3a16cf1bd65064c54d62293917e";
const AGREGATE_TYPE = 5;
const subscribers = new Map();

const socket = new WebSocket(WS_BASE_URL);
const queue = [];
socket.addEventListener("open", () => {
  while (queue.length > 0) {
    const { name, cb } = queue[0];
    // eslint-disable-next-line no-use-before-define
    subscribeToTicker(name, cb);
    queue.shift();
  }
});
socket.addEventListener("message", msg => {
  const data = JSON.parse(msg.data);
  if (Number(data.TYPE) === AGREGATE_TYPE && data.FROMSYMBOL && data.PRICE) {
    const cryptoSubscribers = subscribers.get(data.FROMSYMBOL);
    if (cryptoSubscribers) cryptoSubscribers.forEach(cb => cb(data.PRICE));
  }
});

export const subscribeToTicker = (name, cb) => {
  if (socket.readyState !== socket.OPEN) {
    queue.push({ name, cb });
  } else {
    const prevSubscribers = subscribers.get(name);
    if (prevSubscribers) {
      subscribers.set(name, [...subscribers.get(name), cb]);
    } else {
      subscribers.set(name, [cb]);
    }
    socket.send(
      JSON.stringify({
        action: "SubAdd",
        subs: [`5~CCCAGG~${name}~USD`]
      })
    );
  }
  return () => {
    // unsubscribe from the ticker
    subscribers.set(
      name,
      subscribers.get(name).filter(callback => callback !== cb)
    );
  };
};

export const getAllTickers = async () => {
  return fetch("https://min-api.cryptocompare.com/data/all/coinlist")
    .then(res => res.json())
    .then(res => {
      return Object.values(res.Data).sort((a, b) => (a.Name > b.Name ? 1 : -1));
    });
};
