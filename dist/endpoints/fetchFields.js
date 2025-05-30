import { PLUGIN_FETCH_FIELDS_ENDPOINT, PLUGIN_INSTRUCTIONS_TABLE } from '../defaults.js';
export const fetchFields = (access)=>{
    return {
        handler: async (req)=>{
            const { docs = [] } = await req.payload.find({
                collection: PLUGIN_INSTRUCTIONS_TABLE,
                pagination: false
            });
            let isConfigAllowed = false;
            /* if (access?.settings) {
        try {
          isConfigAllowed = await access.settings({ req })
        } catch (e) {
          req.payload.logger.error('Please check your "access.settings" for request:', req)
        }
      } */ const fieldMap = {};
            docs.forEach((doc)=>{
                fieldMap[doc['schema-path']] = {
                    id: doc.id,
                    fieldType: doc['field-type']
                };
            });
            return Response.json({
                fields: fieldMap,
                isConfigAllowed
            });
        },
        method: 'get',
        path: PLUGIN_FETCH_FIELDS_ENDPOINT
    };
};

//# sourceMappingURL=fetchFields.js.map