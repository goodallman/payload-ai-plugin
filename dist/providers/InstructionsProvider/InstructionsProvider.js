'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import { useAuth, useConfig } from '@payloadcms/ui';
import React, { createContext, useEffect, useState } from 'react';
import { PLUGIN_FETCH_FIELDS_ENDPOINT } from '../../defaults.js';
const initialContext = {
    field: undefined,
    instructions: undefined,
    isConfigAllowed: true,
    path: '',
    schemaPath: ''
};
export const InstructionsContext = /*#__PURE__*/ createContext(initialContext);
export const InstructionsProvider = ({ children })=>{
    const [instructions, setInstructionsState] = useState({});
    const [isConfigAllowed, setIsConfigAllowed] = useState(false);
    const { user } = useAuth();
    const { config } = useConfig();
    const { routes: { api }, serverURL } = config;
    // This is here because each field have separate instructions and
    // their ID is needed to edit them for Drawer
    useEffect(()=>{
        fetch(`${serverURL}${api}${PLUGIN_FETCH_FIELDS_ENDPOINT}`).then(async (res)=>{
            await res.json().then((data)=>{
                setIsConfigAllowed(data?.isConfigAllowed);
                setInstructionsState(data?.fields);
            });
        }).catch((err)=>{
            console.error('InstructionsProvider:', err);
        });
    }, [
        user
    ]);
    return /*#__PURE__*/ _jsx(InstructionsContext.Provider, {
        value: {
            instructions,
            isConfigAllowed
        },
        children: children
    });
};

//# sourceMappingURL=InstructionsProvider.js.map