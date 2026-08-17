window.__ModuleLoader__.load({
	id: "whale-whisper",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		/**
		* Browser half: no runtime work needed. The visible effect is applied by
		* the node half patching the ui-conversation bundle (TurnStatus component).
		* This entry exists only to satisfy the dsh.client roster contract.
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
