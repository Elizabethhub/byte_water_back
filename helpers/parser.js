export const parseBoolean = (queryValue) => {
  const value = queryValue === "true" ? true : queryValue === "false" ? false : null;
  return value;
};
