import {assistantAccess} from '../../utils/assistant-access'
export default defineEventHandler(event=>{assistantAccess(event,useRuntimeConfig(event).aiAllowedOrigins);setResponseStatus(event,204);return ''})
