export const setSafeLexicalState = (state, editorInstance, action = 'replace')=>{
    try {
        const editorState = editorInstance.parseEditorState(state);
        if (editorState.isEmpty()) {
            return;
        }
        editorInstance.setEditorState(editorState);
    } catch (e) {
        console.error('Error setting editor state: ', e);
    }
};

//# sourceMappingURL=setSafeLexicalState.js.map