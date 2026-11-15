import {createClient} from '@supabase/supabase-js'

const camelToSnake=value=>value.replace(/[A-Z]/g,letter=>`_${letter.toLowerCase()}`)
const snakeToCamel=value=>value.replace(/_([a-z])/g,(_,letter)=>letter.toUpperCase())
let client

function getClient(){
 if(!client){
  const {SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY}=process.env
  if(!SUPABASE_URL||!SUPABASE_SERVICE_ROLE_KEY)throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  client=createClient(SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY,{auth:{autoRefreshToken:false,persistSession:false}})
 }
 return client
}

function raise(error){
 if(error)throw error
}

function mapRecord(row){
 if(!row)return row
 const record=Object.fromEntries(Object.entries(row).map(([key,value])=>[snakeToCamel(key),value]))
 if(record.id)record._id=record.id
 return record
}

function mapInput(input){
 return Object.fromEntries(Object.entries(input).map(([key,value])=>[camelToSnake(key),value]))
}

export async function connectSupabase(){
 const {error}=await getClient().from('users').select('id').limit(1)
 raise(error)
}

export async function findOne(table,filters){
 const {data,error}=await getClient().from(table).select('*').match(mapInput(filters)).maybeSingle()
 raise(error)
 return mapRecord(data)
}

export async function findMany(table,filters={},options={}){
 let query=getClient().from(table).select('*').match(mapInput(filters))
 for(const [field,value] of Object.entries(options.gte||{}))query=query.gte(camelToSnake(field),value)
 for(const [field,value] of Object.entries(options.neq||{}))query=query.neq(camelToSnake(field),value)
 if(options.orderBy)query=query.order(camelToSnake(options.orderBy),{ascending:options.ascending??false})
 if(options.limit)query=query.limit(options.limit)
 const {data,error}=await query
 raise(error)
 return data.map(mapRecord)
}

export async function insertOne(table,record){
 const {data,error}=await getClient().from(table).insert(mapInput(record)).select('*').single()
 raise(error)
 return mapRecord(data)
}

export async function insertMany(table,records){
 if(!records.length)return []
 const {data,error}=await getClient().from(table).insert(records.map(mapInput)).select('*')
 raise(error)
 return data.map(mapRecord)
}

export async function updateOne(table,filters,changes){
 const {data,error}=await getClient().from(table).update(mapInput({...changes,updatedAt:new Date().toISOString()})).match(mapInput(filters)).select('*').maybeSingle()
 raise(error)
 return mapRecord(data)
}

export async function deleteMany(table,filters){
 const {data,error}=await getClient().from(table).delete().match(mapInput(filters)).select('id')
 raise(error)
 return data.length
}

export async function placeOrder(values){
 const {data,error}=await getClient().rpc('place_order',{
  p_shop_id:values.shopId,
  p_customer_name:values.customerName,
  p_phone:values.phone,
  p_address:values.address??null,
  p_note:values.note??null,
  p_items:values.items
 })
 raise(error)
 return mapRecord(data)
}
