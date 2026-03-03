/**
 * ZAuthPasskey — shared WebAuthn/passkey utilities.
 * Loaded via <script src="/ui/assets/passkey-utils.js"></script>
 * before each page's inline <script>.
 *
 * Provides base64url encoding, credential serialization, and
 * WebAuthn options preparation shared across login, handoff,
 * and recovery pages.
 */
(function () {
  "use strict";

  /* ── Base64url encoding ──────────────────────────── */

  function b64urlToBuffer(value) {
    var padded =
      value.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice((value.length + 3) % 4);
    var binary = atob(padded);
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++)
      bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function bufferToB64url(buffer) {
    var bytes = new Uint8Array(buffer);
    var binary = "";
    for (var i = 0; i < bytes.byteLength; i++)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary)
      .split("+")
      .join("-")
      .split("/")
      .join("_")
      .replace(/=+$/, "");
  }

  /* ── WebAuthn options preparation ────────────────── */

  function prepareRegisterOptions(options) {
    options.challenge = b64urlToBuffer(options.challenge);
    options.user.id = b64urlToBuffer(options.user.id);
    if (Array.isArray(options.excludeCredentials)) {
      options.excludeCredentials = options.excludeCredentials.map(function (
        cred
      ) {
        return Object.assign({}, cred, { id: b64urlToBuffer(cred.id) });
      });
    }
    return options;
  }

  function prepareLoginOptions(options) {
    options.challenge = b64urlToBuffer(options.challenge);
    if (Array.isArray(options.allowCredentials)) {
      options.allowCredentials = options.allowCredentials.map(function (cred) {
        return Object.assign({}, cred, { id: b64urlToBuffer(cred.id) });
      });
    }
    return options;
  }

  /* ── Credential serialization ────────────────────── */

  function toRegistrationCredentialJSON(credential) {
    var response = credential.response;
    return {
      id: credential.id,
      rawId: bufferToB64url(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: bufferToB64url(response.clientDataJSON),
        attestationObject: bufferToB64url(response.attestationObject),
        transports: response.getTransports ? response.getTransports() : [],
      },
    };
  }

  function toAuthenticationCredentialJSON(credential) {
    var response = credential.response;
    return {
      id: credential.id,
      rawId: bufferToB64url(credential.rawId),
      type: credential.type,
      response: {
        clientDataJSON: bufferToB64url(response.clientDataJSON),
        authenticatorData: bufferToB64url(response.authenticatorData),
        signature: bufferToB64url(response.signature),
        userHandle: response.userHandle
          ? bufferToB64url(response.userHandle)
          : null,
      },
    };
  }

  /* ── JSON canonicalization for ZK proofs ─────────── */

  function canonicalize(value) {
    if (Array.isArray(value)) {
      return value.map(function (item) {
        return canonicalize(item);
      });
    }
    if (!value || typeof value !== "object") {
      return value;
    }
    var keys = Object.keys(value).sort();
    var out = {};
    for (var i = 0; i < keys.length; i++) {
      out[keys[i]] = canonicalize(value[keys[i]]);
    }
    return out;
  }

  /* ── Public API ─────────────────────────────────── */

  window.ZAuthPasskey = {
    b64urlToBuffer: b64urlToBuffer,
    bufferToB64url: bufferToB64url,
    prepareRegisterOptions: prepareRegisterOptions,
    prepareLoginOptions: prepareLoginOptions,
    toRegistrationCredentialJSON: toRegistrationCredentialJSON,
    toAuthenticationCredentialJSON: toAuthenticationCredentialJSON,
    canonicalize: canonicalize,
  };
})();
