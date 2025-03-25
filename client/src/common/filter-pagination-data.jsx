import axios from "axios";

export const FilterPaginationData = async ({
  create_new_arr = false,
  state,
  data,
  page,
  countRoute,
  data_to_send,
}) => {
  let obj;

  if (state !== null && !create_new_arr) {
    // Append new data to the existing state
    obj = {
      ...state,
      results: [...(state.results || []), ...data], // Ensure `results` exists
    };
  } else {
    try {
      const response = await axios.post(
        import.meta.env.VITE_SERVER_DOMAIN + countRoute,
        data_to_send
      );
      const totalDocs = response.data.totalDocs;

      obj = {
        results: data,
        page: 1,
        totalDocs,
      };
    } catch (err) {
      console.error("Error fetching pagination data:", err);
      obj = { results: [], page: 1, totalDocs: 0 }; // Return a valid empty object to prevent crashes
    }
  }

  return obj;
};
