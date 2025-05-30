import { useEditorConfigContext } from '@payloadcms/richtext-lexical/client';
import { useConfig, useField, useForm, useLocale } from '@payloadcms/ui';
import { jsonSchema } from 'ai';
import { useCompletion, experimental_useObject as useObject } from 'ai/react';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { PLUGIN_API_ENDPOINT_GENERATE, PLUGIN_API_ENDPOINT_GENERATE_UPLOAD, PLUGIN_INSTRUCTIONS_TABLE, PLUGIN_NAME } from '../../../defaults.js';
import { useFieldProps } from '../../../providers/FieldProvider/useFieldProps.js';
import { editorSchemaValidator } from '../../../utilities/editorSchemaValidator.js';
import { setSafeLexicalState } from '../../../utilities/setSafeLexicalState.js';
import { useHistory } from './useHistory.js';
export const useGenerate = ({ instructionId })=>{
    // Create a ref to hold the current instructionId
    const instructionIdRef = useRef(instructionId);
    // Update the ref whenever instructionId changes
    useEffect(()=>{
        instructionIdRef.current = instructionId;
    }, [
        instructionId
    ]);
    const { type, path: pathFromContext } = useFieldProps();
    const editorConfigContext = useEditorConfigContext();
    const { editor } = editorConfigContext;
    const { config } = useConfig();
    const { routes: { api }, serverURL } = config;
    const { setValue } = useField({
        path: pathFromContext
    });
    const { set: setHistory } = useHistory();
    const { getData } = useForm();
    const localFromContext = useLocale();
    const { config: { collections } } = useConfig();
    const collection = collections.find((collection)=>collection.slug === PLUGIN_INSTRUCTIONS_TABLE);
    const { custom: { [PLUGIN_NAME]: { editorConfig = {} } = {} } = {} } = collection.admin;
    const { schema: editorSchema = {} } = editorConfig;
    const memoizedValidator = useMemo(()=>{
        return editorSchemaValidator(editorSchema);
    }, [
        editorSchema
    ]);
    const memoizedSchema = useMemo(()=>jsonSchema(editorSchema, {
            validate: (value)=>{
                const isValid = memoizedValidator(value);
                if (isValid) {
                    return {
                        success: true,
                        value
                    };
                } else {
                    return {
                        error: new Error('Invalid schema'),
                        success: false
                    };
                }
            }
        }), [
        memoizedValidator
    ]);
    const { isLoading: loadingObject, object, stop: objectStop, submit } = useObject({
        api: `/api${PLUGIN_API_ENDPOINT_GENERATE}`,
        onError: (error)=>{
            console.error('Error generating object:', error);
        },
        onFinish: (result)=>{
            if (result.object) {
                setHistory(result.object);
                setValue(result.object);
            } else {
                console.log('onFinish: result ', result);
            }
        },
        schema: memoizedSchema
    });
    useEffect(()=>{
        if (!object) return;
        requestAnimationFrame(()=>{
            const validateObject = memoizedSchema.validate(object);
            if (validateObject?.success) {
                setSafeLexicalState(object, editor);
            }
        });
    }, [
        object,
        editor
    ]);
    const { complete, completion, isLoading: loadingCompletion, stop: completionStop } = useCompletion({
        api: `${serverURL}${api}${PLUGIN_API_ENDPOINT_GENERATE}`,
        onError: (error)=>{
            console.error('Error generating text:', error);
        },
        onFinish: (prompt, result)=>{
            setHistory(result);
        },
        streamProtocol: 'data'
    });
    useEffect(()=>{
        if (!completion) return;
        requestAnimationFrame(()=>{
            setValue(completion);
        });
    }, [
        completion
    ]);
    const streamObject = useCallback(({ action = 'Compose', params })=>{
        const doc = getData();
        const currentInstructionId = instructionIdRef.current;
        const options = {
            action,
            actionParams: params,
            instructionId: currentInstructionId
        };
        submit({
            doc,
            locale: localFromContext?.code,
            options
        });
    }, [
        localFromContext?.code,
        instructionIdRef
    ]);
    const streamText = useCallback(async ({ action = 'Compose', params })=>{
        const doc = getData();
        const currentInstructionId = instructionIdRef.current;
        const options = {
            action,
            actionParams: params,
            instructionId: currentInstructionId
        };
        await complete('', {
            body: {
                doc,
                locale: localFromContext?.code,
                options
            }
        });
    }, [
        getData,
        localFromContext?.code,
        instructionIdRef,
        complete
    ]);
    const generateUpload = useCallback(async ()=>{
        const doc = getData();
        const currentInstructionId = instructionIdRef.current;
        return fetch(`${serverURL}${api}${PLUGIN_API_ENDPOINT_GENERATE_UPLOAD}`, {
            body: JSON.stringify({
                doc,
                locale: localFromContext?.code,
                options: {
                    instructionId: currentInstructionId
                }
            }),
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'POST'
        }).then(async (uploadResponse)=>{
            if (uploadResponse.ok) {
                const { result } = await uploadResponse.json();
                if (!result) throw new Error('generateUpload: Something went wrong');
                setValue(result?.id);
                setHistory(result?.id);
                console.log('Image updated...', result);
            } else {
                const { errors = [] } = await uploadResponse.json();
                const errStr = errors.map((error)=>error.message).join(', ');
                throw new Error(errStr);
            }
            return uploadResponse;
        }).catch((error)=>{
            console.error('Error generating or setting your upload, please set it manually if its saved in your media files: ', error);
        });
    }, [
        getData,
        localFromContext?.code,
        instructionIdRef,
        setValue
    ]);
    const generate = useCallback(async (options)=>{
        if (type === 'richText') {
            return streamObject(options);
        }
        if ([
            'text',
            'textarea'
        ].includes(type)) {
            return streamText(options);
        }
        if (type === 'upload') {
            return generateUpload();
        }
    }, [
        generateUpload,
        streamObject,
        streamText,
        type
    ]);
    const stop = useCallback(()=>{
        console.log('Stopping...');
        objectStop();
        completionStop();
    }, [
        objectStop,
        completionStop
    ]);
    return {
        generate,
        isLoading: loadingCompletion || loadingObject,
        stop
    };
};

//# sourceMappingURL=useGenerate.js.map