import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { FieldProvider } from '../../providers/FieldProvider/FieldProvider.js';
import { useInstructions } from '../../providers/InstructionsProvider/useInstructions.js';
import { Compose } from '../../ui/Compose/Compose.js';
export const ComposeFeatureComponent = (props)=>{
    const { id: instructionId, isConfigAllowed } = useInstructions({
        schemaPath: props?.clientProps?.schemaPath
    });
    return /*#__PURE__*/ _jsx(FieldProvider, {
        context: {
            type: props?.clientProps?.field?.type,
            path: props?.clientProps?.path,
            schemaPath: props?.clientProps?.schemaPath
        },
        children: /*#__PURE__*/ _jsx(Compose, {
            descriptionProps: {
                field: props?.clientProps?.field,
                path: props?.clientProps?.path,
                schemaPath: props?.clientProps?.schemaPath,
                ...props?.clientProps
            },
            instructionId: instructionId,
            isConfigAllowed: isConfigAllowed
        })
    });
};

//# sourceMappingURL=ComposeFeatureComponent.js.map