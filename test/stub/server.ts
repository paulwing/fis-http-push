import {URLSearchParams} from 'url';
import nock from 'nock';
import debugFactory from 'debug';

const EMAIL = 'harttle@example.com';
const TOKEN = 'MOCK_TOKEN';
const CODE = 'MOCK_CODE';
const debug = debugFactory('fhp');

export function startServer() {
    nock('http://localhost:1080')
        .persist()
        .post('/v1/upload').reply(upload)
        .post('/v1/authorize').reply(authorize)
        .post('/v1/validate').reply(validate);
}
function upload(uri, body) {
    const contentType = this.req.getHeader('content-type');
    if (typeof contentType !== 'string') {
        return [400, {'errno': '100023', 'errmsg': 'no content-type'}];
    }
    const email = getField('email', body);
    const code = getField('code', body);
    const token = getField('token', body);
    const to = getField('to', body);
    const file = getField('file', body);

    if (email !== EMAIL) {
        debug('responding invalid email');
        return [200, {'errno': 100001, 'errmsg': 'invalid email'}];
    }
    else if (token !== TOKEN || code !== CODE) {
        debug('responding invalid token');
        return [200, {'errno': 100002, 'errmsg': 'invalid token'}];
    }
    else if (!/^\/tmp\//.test(to)) {
        debug('responding invalid path');
        return [200, {'errno': 100003, 'errmsg': 'invalid path'}];
    }
    const size = Buffer.from(file).length;
    debug('responding success');
    return [200, {errno: 0, msg: `${size} bytes uploaded`}];
}

function authorize(uri, body: string) {
    const params = new URLSearchParams(body);
    if (params.get('email') !== EMAIL) {
        return [200, {'errno': 100004, 'errmsg': 'invalid email'}];
    }
    return [200, {errno: 0, msg: `code sent to ${EMAIL}`}];
}

function validate(uri, body: string) {
    const params = new URLSearchParams(body);
    if (params.get('email') !== EMAIL) {
        return [200, {'errno': 100005, 'errmsg': 'invalid email'}];
    }
    if (params.get('code') !== CODE) {
        return [200, {'errno': 100006, 'errmsg': 'invalid code'}];
    }
    return [200, {errno: 0, data: {token: TOKEN}}];
}

function getField(name, body) {
    const match = body.match(new RegExp(`name="${name}"[^\r]*\r\n\r\n([^\r]*)\r\n`));
    return match && match[1];
}
