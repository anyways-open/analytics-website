// Manages the URL state saving/restoring it.

ANYWAYS.history = {
    // holds the state.
    state: {},

	// initializes the history management.
    initialize: function () {
        // get stuff from history if it exists.
        var historyState = History.getState();
        this.state = historyState.url.queryStringToJSON();
    },

	// updates the current url with the current state.
    updateState: function () {
        if (this.state) {
            // create url params.
            url = '?' + $.param(this.state);
            // push new history state.
            History.pushState(this.state, $(document).find("title").text(), url);
        }
	},

	getShareUrl: function () {
	    return encodeURIComponent(document.location.href);
	}
};

ANYWAYS.history.initialize();