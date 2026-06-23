// Wikimedia's User-Agent policy throttles/blocks anonymous clients without a
// descriptive UA, so every WDQS + Wikipedia request must identify the app and a
// contact. `Api-User-Agent` is the fallback for contexts (web) where the browser
// forbids setting `User-Agent` directly.
const UA = "Nearly Departed/1.0 (nearlydepartedapp@gmail.com)";

export const WIKIMEDIA_HEADERS = {
  "User-Agent": UA,
  "Api-User-Agent": UA,
};
