import { defaultPrompts } from '../ai/prompts.js';
import { PLUGIN_API_ENDPOINT_GENERATE, PLUGIN_API_ENDPOINT_GENERATE_UPLOAD, PLUGIN_INSTRUCTIONS_TABLE, PLUGIN_NAME } from '../defaults.js';
import { registerEditorHelper } from '../libraries/handlebars/helpers.js';
import { handlebarsHelpersMap } from '../libraries/handlebars/helpersMap.js';
import { replacePlaceholders } from '../libraries/handlebars/replacePlaceholders.js';
import { getGenerationModels } from '../utilities/getGenerationModels.js';
const assignPrompt = async (action, { type, actionParams, context, field, layout, systemPrompt = '', template })=>{
    const prompt = await replacePlaceholders(template, context);
    const toLexicalHTML = type === 'richText' ? handlebarsHelpersMap.toHTML.name : '';
    const assignedPrompts = {
        layout: type === 'richText' ? layout : undefined,
        prompt,
        //TODO: Define only once on a collection level
        system: type === 'richText' ? systemPrompt : undefined
    };
    if (action === 'Compose') {
        return assignedPrompts;
    }
    const { layout: getLayout, system: getSystemPrompt } = defaultPrompts.find((p)=>p.name === action);
    let updatedLayout = layout;
    if (getLayout) {
        updatedLayout = getLayout();
    }
    const system = getSystemPrompt({
        ...actionParams || {},
        prompt,
        systemPrompt
    });
    return {
        layout: updatedLayout,
        // TODO: revisit this toLexicalHTML
        prompt: await replacePlaceholders(`{{${toLexicalHTML} ${field}}}`, context),
        system
    };
};
export const endpoints = (pluginConfig)=>({
        textarea: {
            //TODO:  This is the main endpoint for generating content - its just needs to be renamed to 'generate' or something.
            handler: async (req)=>{
                const data = await req.json?.();
                const { locale = 'en', options } = data;
                const { action, actionParams, instructionId } = options;
                const contextData = data.doc;
                if (!instructionId) {
                    throw new Error(`Instruction ID is required for "${PLUGIN_NAME}" to work, please check your configuration`);
                }
                const instructions = await req.payload.findByID({
                    id: instructionId,
                    collection: PLUGIN_INSTRUCTIONS_TABLE
                });
                const { collections } = req.payload.config;
                const collection = collections.find((collection)=>collection.slug === PLUGIN_INSTRUCTIONS_TABLE);
                const { custom: { [PLUGIN_NAME]: { editorConfig = {} } = {} } = {} } = collection.admin;
                const { schema: editorSchema = {} } = editorConfig;
                const { prompt: promptTemplate = '' } = instructions;
                const schemaPath = instructions['schema-path'];
                const fieldName = schemaPath?.split('.').pop();
                registerEditorHelper(req.payload, schemaPath);
                const { defaultLocale, locales = [] } = req.payload.config.localization || {};
                const localeData = locales.find((l)=>{
                    return l.code === locale;
                });
                const localeInfo = localeData?.label[defaultLocale] || locale;
                const model = getGenerationModels(pluginConfig).find((model)=>model.id === instructions['model-id']);
                const settingsName = model.settings?.name;
                const modelOptions = instructions[settingsName] || {};
                const prompts = await assignPrompt(action, {
                    type: instructions['field-type'],
                    actionParams,
                    context: contextData,
                    field: fieldName,
                    layout: instructions.layout,
                    systemPrompt: instructions.system,
                    template: promptTemplate
                });
                prompts.prompt = `
          ${prompts.prompt}\n\n
          The locale the user is currently using is ${localeInfo}.\n\n
        `;
                if (action === 'Translate') {
                    prompts.prompt = `
            Translate the field of ${fieldName} to ${data.options.actionParams.locale}:\n\n${prompts.prompt}\n\n,
            Make sure to output only the translation without any other text or explanation as you are not interacting with user.\n\n
            here is the whole document with the field in it: ${JSON.stringify(data.doc)}
          `;
                }
                // console.log('Running handler with prompts:', prompts)
                return model.handler?.(prompts.prompt, {
                    ...modelOptions,
                    editorSchema,
                    layout: prompts.layout,
                    locale: localeInfo,
                    system: prompts.system
                }).catch((error)=>{
                    console.error('Error: endpoint - generating text:', error);
                    return new Response(JSON.stringify(error.message), {
                        status: 500
                    });
                });
            },
            method: 'post',
            path: PLUGIN_API_ENDPOINT_GENERATE
        },
        upload: {
            handler: async (req)=>{
                const data = await req.json?.();
                const { options } = data;
                const { instructionId } = options;
                const contextData = data.doc;
                let instructions = {
                    'model-id': '',
                    prompt: ''
                };
                if (instructionId) {
                    // @ts-expect-error
                    instructions = await req.payload.findByID({
                        id: instructionId,
                        collection: PLUGIN_INSTRUCTIONS_TABLE
                    });
                }
                const { prompt: promptTemplate = '' } = instructions;
                const schemaPath = instructions['schema-path'];
                registerEditorHelper(req.payload, schemaPath);
                const text = await replacePlaceholders(promptTemplate, contextData);
                const modelId = instructions['model-id'];
                const uploadCollectionSlug = instructions['relation-to'];
                const model = getGenerationModels(pluginConfig).find((model)=>model.id === modelId);
                const settingsName = model.settings?.name;
                const modelOptions = instructions[settingsName] || {};
                const result = await model.handler?.(text, modelOptions);
                const assetData = await req.payload.create({
                    collection: uploadCollectionSlug,
                    data: result.data,
                    file: result.file
                });
                return new Response(JSON.stringify({
                    result: {
                        id: assetData.id,
                        alt: assetData.alt
                    }
                }));
            },
            method: 'post',
            path: PLUGIN_API_ENDPOINT_GENERATE_UPLOAD
        }
    });

//# sourceMappingURL=index.js.map