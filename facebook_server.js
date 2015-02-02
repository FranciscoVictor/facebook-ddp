Facebook = {};

var querystring = Npm.require('querystring');


OAuth.registerService('facebook', 2, null, function(query) {

  var response = getTokenResponse(query);
  var accessToken = response.accessToken;
  var identity = getIdentity(accessToken);

  var serviceData = {
    accessToken: accessToken,
    expiresAt: (+new Date) + (1000 * response.expiresIn)
  };

  // include all fields from facebook
  // http://developers.facebook.com/docs/reference/login/public-profile-and-friend-list/
  var whitelisted = ['id', 'email', 'name', 'first_name',
      'last_name', 'link', 'username', 'gender', 'locale', 'age_range'];

  var fields = _.pick(identity, whitelisted);
  _.extend(serviceData, fields);

  return {
    serviceData: serviceData,
    options: {profile: {name: identity.name}}
  };
});

// checks whether a string parses as JSON
var isJSON = function (str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
};

// returns an object containing:
// - accessToken
// - expiresIn: lifetime of token in seconds
var getTokenResponse = function (query) {
  var config = ServiceConfiguration.configurations.findOne({service: 'facebook'});
  if (!config)
    throw new ServiceConfiguration.ConfigError();

  var responseContent;
  try {
    // Request an access token, or request access token info if it was already given
    if (query.accessToken) {
      var response = HTTP.get(
        "https://graph.facebook.com/app", {
          params: {
            access_token: query.accessToken
          }
        }).content;
      response = JSON.parse(response);
      if (response.id == config.appId) {
          responseContent = "access_token=" + query.accessToken + "&expires=5184000";
      } else {
      throw new Error("Failed to complete OAuth handshake with Facebook. The access token's app ID and the server's app ID did not match.");
      }
    } else {
      responseContent = HTTP.get(
        "https://graph.facebook.com/oauth/access_token", {
          params: {
            client_id: config.appId,
            redirect_uri: OAuth._redirectUri('facebook', config),
            client_secret: OAuth.openSecret(config.secret),
            code: query.code
          }
        }).content;
    }
  } catch (err) {
    throw _.extend(new Error("Failed to complete OAuth handshake with Facebook. " + err.message),
                   {response: err.response});
  }

  // If 'responseContent' parses as JSON, it is an error.
  // XXX which facebook error causes this behvaior?
  if (isJSON(responseContent)) {
    throw new Error("Failed to complete OAuth handshake with Facebook. " + responseContent);
  }

  // Success!  Extract the facebook access token and expiration
  // time from the response
  var parsedResponse = querystring.parse(responseContent);
  var fbAccessToken = parsedResponse.access_token;
  var fbExpires = parsedResponse.expires;

  if (!fbAccessToken) {
    throw new Error("Failed to complete OAuth handshake with facebook " +
                    "-- can't find access token in HTTP response. " + responseContent);
  }
  return {
    accessToken: fbAccessToken,
    expiresIn: fbExpires
  };
};

var getIdentity = function (accessToken) {
  try {
    return HTTP.get("https://graph.facebook.com/me", {
      params: {access_token: accessToken}}).data;
  } catch (err) {
    throw _.extend(new Error("Failed to fetch identity from Facebook. " + err.message),
                   {response: err.response});
  }
};

Facebook.retrieveCredential = function(credentialToken, credentialSecret) {
  return OAuth.retrieveCredential(credentialToken, credentialSecret);
};
