/* eslint-disable import/prefer-default-export */
export const BASE_URL = "https://min-api.cryptocompare.com/";

const subscribers = new Map();

/**
 *
 * @returns {{string: {string: number}}} object with crypto names as keys.
 */
const fetchData = async () => {
  const fsyms = Array.from(subscribers.keys());
  if (fsyms.length < 1) return { Response: "Error" };
  fsyms.map(item => item.name).join(",");
  const res = await fetch(`${BASE_URL}data/pricemulti?fsyms=${fsyms}&tsyms=USD`);
  const data = await res.json();
  return data;
};

setInterval(() => {
  fetchData().then(data => {
    if (data.Response === "Error") {
      return;
    }
    Object.entries(data).forEach(crypto => {
      const cryptoSubscribers = subscribers.get(crypto[0]);
      if (cryptoSubscribers) cryptoSubscribers.forEach(cb => cb(data[crypto[0]].USD));
    });
  });
}, 5000);

export const subscribeToTicker = (name, cb) => {
  const prevSubscribers = subscribers.get(name);
  if (prevSubscribers) {
    subscribers.set(name, [...subscribers.get(name), cb]);
  } else {
    subscribers.set(name, [cb]);
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
