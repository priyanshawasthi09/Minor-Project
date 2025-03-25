const LoadMoreDataBtn = ({ state, fetchDataFun }) => {
  if (!state || !state.results || state.results.length === 0) return null;

  if (state.totalDocs > state.results.length) {
    return (
      <div>
        <button
          className="text-dark-grey p-2 px-3 hover:bg-grey/30 rounded-md flex items-center gap-2"
          onClick={() => fetchDataFun({ page: state.page + 1 })}
        >
          Load More
        </button>
      </div>
    );
  }
  return null;
};

export default LoadMoreDataBtn;
