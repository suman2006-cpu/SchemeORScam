import assert from 'node:assert/strict';
import test from 'node:test';
import { expandUrlSafely, isBlockedIp } from './ssrf';

test('isBlockedIp rejects all private, loopback, link-local, and ULA IPv4/IPv6 ranges', () => {
  const blocked = [
    '127.0.0.1',
    '127.255.255.254',
    '10.0.0.1',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.1',
    '169.254.169.254',
    '0.0.0.0',
    '::1',
    'fc00::1',
    'fd12:3456::1',
    'fe80::1',
    '::ffff:127.0.0.1',
    '::ffff:10.0.0.5',
  ];
  for (const ip of blocked) {
    assert.equal(isBlockedIp(ip), true, `Expected ${ip} to be blocked`);
  }

  const allowed = ['8.8.8.8', '1.1.1.1', '203.0.113.10', '2606:4700:4700::1111'];
  for (const ip of allowed) {
    assert.equal(isBlockedIp(ip), false, `Expected ${ip} to be allowed`);
  }
});

test('expandUrlSafely blocks redirects to localhost and DNS rebinding to private IPs', async () => {
  // 1. Direct private IP blocked before fetch
  let fetchCalled = false;
  const directPrivate = await expandUrlSafely('http://127.0.0.1/admin', {
    fetchFn: async () => {
      fetchCalled = true;
      return new Response(null, { status: 200 });
    },
  });
  assert.equal(directPrivate.unresolved, true);
  assert.equal(directPrivate.blockedReason, 'SSRF_BLOCKED_IP');
  assert.equal(fetchCalled, false);

  // 2. Redirect to localhost blocked on hop 2
  const redirectLocal = await expandUrlSafely('https://bit.ly/test', {
    resolveDns: async (host) => {
      if (host === 'bit.ly') return [{ address: '203.0.113.20', family: 4 }];
      return [{ address: '127.0.0.1', family: 4 }];
    },
    fetchFn: async () =>
      new Response(null, {
        status: 302,
        headers: { location: 'http://127.0.0.1:8080/internal' },
      }),
  });
  assert.equal(redirectLocal.unresolved, true);
  assert.equal(redirectLocal.blockedReason, 'SSRF_BLOCKED_IP');

  // 3. DNS rebinding: first hop public, redirected hostname resolves to 10.0.0.5
  const rebind = await expandUrlSafely('https://bit.ly/rebind', {
    resolveDns: async (host) => {
      if (host === 'bit.ly') return [{ address: '203.0.113.20', family: 4 }];
      if (host === 'internal.corp.example') return [{ address: '10.0.0.5', family: 4 }];
      return [{ address: '203.0.113.30', family: 4 }];
    },
    fetchFn: async () =>
      new Response(null, {
        status: 301,
        headers: { location: 'https://internal.corp.example/secret' },
      }),
  });
  assert.equal(rebind.unresolved, true);
  assert.equal(rebind.blockedReason, 'SSRF_BLOCKED_RESOLVED_IP');

  // 4. Too many redirects (>5) stopped cleanly
  let hopCounter = 0;
  const loop = await expandUrlSafely('https://bit.ly/loop', {
    resolveDns: async () => [{ address: '203.0.113.25', family: 4 }],
    fetchFn: async () => {
      hopCounter += 1;
      return new Response(null, {
        status: 302,
        headers: { location: `https://bit.ly/hop-${hopCounter}` },
      });
    },
  });
  assert.equal(loop.unresolved, true);
  assert.equal(loop.blockedReason, 'MAX_REDIRECTS');
  assert.equal(loop.hops, 5);

  // 5. Slow server times out cleanly
  const slow = await expandUrlSafely('https://bit.ly/slow', {
    timeoutMs: 80,
    resolveDns: async () => [{ address: '203.0.113.26', family: 4 }],
    fetchFn: (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const err = new Error('Aborted');
          err.name = 'AbortError';
          reject(err);
        });
      }),
  });
  assert.equal(slow.unresolved, true);
  assert.equal(slow.blockedReason, 'TIMEOUT');

  // 6. Clean expansion captures APK MIME and filename
  const cleanApk = await expandUrlSafely('https://bit.ly/ekyc', {
    resolveDns: async () => [{ address: '203.0.113.40', family: 4 }],
    fetchFn: async (input) => {
      const u = String(input);
      if (u.includes('bit.ly')) {
        return new Response(null, {
          status: 302,
          headers: { location: 'https://pm-kisan-ekyc.in/download' },
        });
      }
      return new Response(null, {
        status: 200,
        headers: {
          'content-type': 'application/vnd.android.package-archive',
          'content-disposition': 'attachment; filename="PMKISAN.apk"',
        },
      });
    },
  });
  assert.equal(cleanApk.unresolved, false);
  assert.equal(cleanApk.finalUrl, 'https://pm-kisan-ekyc.in/download');
  assert.equal(cleanApk.attachmentFilename, 'PMKISAN.apk');
});
