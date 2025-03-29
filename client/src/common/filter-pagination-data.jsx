import axios from "axios";

export const FilterPaginationData = async ({
  create_new_arr = false,
  state,
  data,
  page,
  countRoute,
  data_to_send = {},
}) => {
  let obj;

  if (state !== null && !create_new_arr) {
    // Append new data to the existing state
    obj = {
      ...state,
      results: [...state.results, ...data],
      page: page, // Ensure `results` exists
    };
  } else {
    await axios
      .post(import.meta.env.VITE_SERVER_DOMAIN + countRoute, data_to_send)
      .then(({ data: { totalDocs } }) => {
        obj = {
          results: data,
          page: 1,
          totalDocs,
        };
      })
      .catch((err) => {
        console.error("Error fetching pagination data:", err); // Return a valid empty object to prevent crashes
      });
  }
  return obj;
};
