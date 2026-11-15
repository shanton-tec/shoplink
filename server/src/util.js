export const slugify=s=>String(s).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,40)||'shop'
export const waMessage=(shop,order)=>[
 `New order for ${shop.name}`,`Order #${String(order._id).slice(-6)}`,'',
 ...order.items.map(i=>`${i.qty} x ${i.name} = Rs ${i.qty*i.price}`),'',
 `Total: Rs ${order.total}`,'',`Name: ${order.customerName}`,`Phone: ${order.phone}`,
 order.address?`Address: ${order.address}`:null,order.note?`Note: ${order.note}`:null
].filter(l=>l!==null).join('\n')
