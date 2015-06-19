//database

function DB() {
	var tDB = {};
	var datastore = null;

	// Database version.
	var version = 1;
	var dbName = "followMeStore";
	var tracksStoreName = "followMeTracks";

	/**
	 * Open a connection to the datastore.
	 */
	this.open = function(callback) {

		// Open a connection to the datastore.
		var request = indexedDB.open(dbName, version);

		// Handle datastore upgrades.
		request.onupgradeneeded = function(e) {
			var db = e.target.result;

			e.target.transaction.onerror = this.onerror;

			// Delete the old datastore.
			if (db.objectStoreNames.contains(tracksStoreName)) {
				db.deleteObjectStore(tracksStoreName);
			}

			// Create a new datastore.
			var store = db.createObjectStore(tracksStoreName, {
				keyPath : 'timestamp'
			});
		};

		// Handle successful datastore access.
		request.onsuccess = function(e) {
			// Get a reference to the DB.
			datastore = e.target.result;

			// Execute the callback.
			callback();
		};

		// Handle errors when opening the datastore.
		request.onerror = this.onerror;
	};

	/**
	 * Fetch all of the tracks items in the datastore.
	 */
	this.fetchTodos = function(callback) {
		var db = datastore;
		var transaction = db.transaction([ tracksStoreName ], 'readwrite');
		var objStore = transaction.objectStore(tracksStoreName);

		var keyRange = IDBKeyRange.lowerBound(0);
		var cursorRequest = objStore.openCursor(keyRange);

		var todos = [];

		transaction.oncomplete = function(e) {
			// Execute the callback function.
			callback(todos);
		};

		cursorRequest.onsuccess = function(e) {
			var result = e.target.result;

			if (!!result == false) {
				return;
			}

			todos.push(result.value);

			// result.continue();
		};

		cursorRequest.onerror = this.onerror;
	};

	/**
	 * Create a new todo item.
	 */
	this.createTodo = function(text, callback) {
	  // Get a reference to the db.
	  var db = datastore;

	  // Initiate a new transaction.
	  var transaction = db.transaction([tracksStoreName], 'readwrite');

	  // Get the datastore.
	  var objStore = transaction.objectStore(tracksStoreName);

	  // Create a timestamp for the todo item.
	  var timestamp = new Date().getTime();

	  // Create an object for the todo item.
	  var todo = {
	    'text': text,
	    'timestamp': timestamp
	  };

	  // Create the datastore request.
	  var request = objStore.put(todo);

	  // Handle a successful datastore put.
	  request.onsuccess = function(e) {
	    // Execute the callback function.
	    callback(todo);
	  };

	  // Handle errors.
	  request.onerror = this.onerror;
	};
	
	
	this.onerror = function(e) {
		error("Napaka: " + e.message);
	}

};