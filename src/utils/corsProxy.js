export const withCorsProxy = (url) => {
  return `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
};
