import test from 'node:test'
import assert from 'node:assert/strict'
import {slugify,waMessage} from '../src/util.js'
test('slugify',()=>{assert.equal(slugify('Anna Bakery!'),'anna-bakery');assert.equal(slugify('###'),'shop')})
test('waMessage',()=>{
 const m=waMessage({name:'Anna'},{_id:'abc123456',items:[{qty:2,name:'Cake',price:100}],total:200,customerName:'Ravi',phone:'9999999999'})
 assert.match(m,/2 x Cake = Rs 200/);assert.match(m,/Total: Rs 200/);assert.ok(!m.includes('Address'))})
