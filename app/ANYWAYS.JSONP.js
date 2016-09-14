// ANYWAYS JSONP call wrapper 
// [wrapper for JSONP calls with DOM cleaning, fencing, timout handling]

ANYWAYS.JSONP = {

	// storage to keep track of unfinished JSONP calls
	fences: {},
	callbacks: {},
	timeouts: {},
	timers: {},


	// default callback routines
	late: function() {},	
	empty: function() {},


	// init JSONP call
	call: function(source, callback_function, timeout_function, timeout, id, parameters) {
		// only one active JSONP call per id
		if (ANYWAYS.JSONP.fences[id] == true)
			return false;
		ANYWAYS.JSONP.fences[id] = true;

		// wrap timeout function
		ANYWAYS.JSONP.timeouts[id] = function (response) {
			try {
				timeout_function(response, parameters);
			} finally {
				ANYWAYS.JSONP.callbacks[id] = ANYWAYS.JSONP.late;				// clean functions
				ANYWAYS.JSONP.timeouts[id] = ANYWAYS.JSONP.empty;
				ANYWAYS.JSONP.fences[id] = undefined;						// clean fence
			}
		};

		// wrap callback function
		ANYWAYS.JSONP.callbacks[id] = function (response) {
			clearTimeout(ANYWAYS.JSONP.timers[id]);						// clear timeout timer
			ANYWAYS.JSONP.timers[id] = undefined;

			try {
				callback_function(response, parameters);				// actual wrapped callback 
			} finally {
				ANYWAYS.JSONP.callbacks[id] = ANYWAYS.JSONP.empty;			// clean functions
				ANYWAYS.JSONP.timeouts[id] = ANYWAYS.JSONP.late;
				ANYWAYS.JSONP.fences[id] = undefined;						// clean fence
			}
		};

		// clean DOM
		var jsonp = document.getElementById('jsonp_'+id);
		if(jsonp)
			jsonp.parentNode.removeChild(jsonp);

		// add script to DOM
		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.id = 'jsonp_' + id;
		script.src = source.replace(/%jsonp/, "ANYWAYS.JSONP.callbacks." + id);
		document.head.appendChild(script);

		// start timeout timer
		ANYWAYS.JSONP.timers[id] = setTimeout(ANYWAYS.JSONP.timeouts[id], timeout);
		return true;
	},

	clear: function(id) {
		clearTimeout(ANYWAYS.JSONP.timers[id]);					// clear timeout timer
		ANYWAYS.JSONP.callbacks[id] = ANYWAYS.JSONP.empty;			// clean functions
		ANYWAYS.JSONP.timeouts[id] = ANYWAYS.JSONP.empty;
		ANYWAYS.JSONP.fences[id] = undefined;						// clean fence

		// clean DOM
		var jsonp = document.getElementById('jsonp_'+id);
		if(jsonp)
			jsonp.parentNode.removeChild(jsonp);		
	},

	// reset all data
	reset: function() {
		ANYWAYS.JSONP.fences = {};
		ANYWAYS.JSONP.callbacks = {};
		ANYWAYS.JSONP.timeouts = {};
		ANYWAYS.JSONP.timers = {};
	}
};