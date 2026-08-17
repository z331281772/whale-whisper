window.__ModuleLoader__.load({
	id: "whisper",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		/**
		* Browser half: the visible effect is applied by the node half patching
		* the ui-conversation bundle (dictionary + TurnStatus). Nothing more is
		* needed in the browser; the entry exists to satisfy the dsh.client
		* roster contract (client-modules serves /plugins/whisper/client.js).
		*/
		/** Required services on the client root context. */
		const inject = [];
		/** Client plugin body: no-op. */
		function apply() {}
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
