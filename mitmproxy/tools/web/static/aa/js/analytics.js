// sudo nohup /root/.local/bin/mitmweb  --set block_global=false --listen-port=23456 --web-port=8083 --web-host=165.22.223.94 &
requestList = []
hitList = [];
provList = [];

tableView = {}
tempView = {}
window.latestData
$( document ).ready(function() 
                    {


$(".btn-group").click(function(){
    addInfo(window.latestData);
});



function createTable(data)
{
    innerhtml = '<tbody>'
    for ( y in data)
        {
            innerhtml+='<tr><td>'+y+'</td>';
            for (q in data[y])
                {
                    innerhtml+='<td><a href="javascript:void()" data-toggle="modal" data-target="#s-popup">'+data[y][q]+'</a></td>';
                }
            innerhtml+='</tr>'
        }
    innerhtml+='</tbody>'
    return innerhtml;
}

function isFiltered(name)
{
    filter = []
    $(".btn-group").find("input:checked").next().each(function(i,k)
                                                  {
                                                        filter.push($(k).text());
                                                });
    if(filter.includes('All'))
        {
            return true;
        }
    else 
        {
            return filter.includes(name);
        }
}

function addInfo(data)
{
    window.latestData = data;
    //filter = "Google Tag"
    hitList.push(data);
    tableView = {}
    tempView = {}
    tableView['Solution']=[];
    for (x in hitList)
    {
     if(isFiltered(hitList[x].provider.name))
     {
     hitData = hitList[x].data;
     for(x in hitData)
         {
            tableView[hitData[x].field] =[];  
         }
     }   
    }
    
    for ( x in hitList)
    {
     if(isFiltered(hitList[x].provider.name))
     {
     hitData = hitList[x].data;
     tempView={}
         tempView['Solution']=hitList[x].provider.name;
     for(x in hitData)
         {
             tempView[hitData[x].field] = hitData[x].value
         }
     for(y in tableView)
         {
             if(typeof(tempView[y])!=='undefined')
                {
                    tableView[y].push(tempView[y]);
                }
                else
                {
                    tableView[y].push("");
                }
         }
     }
        
    html = createTable(tableView);
    $('table.main-data').html(html);
    }
}





host = window.location.host;
p = new WebSocket('ws://'+host+'/updates')
p.onmessage = function (evt) { 
                  var received_msg = JSON.parse(evt.data);
                  if(received_msg.resource=='flows')
                  {
                    
                      rawUrl = received_msg.data.request.scheme+"://"+received_msg.data.request.host+received_msg.data.request.path;
                      //console.log(rawUrl);
                      for ( x in providers)
                        {
                                
                                if(providers[x].urlMatch(rawUrl))
                                    {
                                        
                                        
                                      msgId = received_msg.data.id;
                                      if(!requestList.includes(msgId))
                                          {
                                                requestList.push(msgId);
                                                if(!provList.includes(providers[x].name))
                                                  {
                                                    console.log(provList)
                                                    console.log(!provList.includes(providers[x].name))
                                                    console.log(providers[x].name)
                                                    provList.push(providers[x].name);
                                                    $('.btn-group').append('<label class="btn btn-light"><input type="checkbox" autocomplete="off"><span class="">'+providers[x].name+'</span></label>');
                                                  }
                                                q = providers[x].parseUrl(rawUrl);  
                                                addInfo(q);
                                          }
                                        
                                    }
                            
                        }
                  }
                  
               };



class BaseProvider
{
    constructor()
    {
        this._key        = "";
        this._pattern    = /.*/;
        this._name       = "";
        this._type       = "";
        this._keywords   = [];
    }

    /**
     * Get the Provider's key
     *
     * @returns {string}
     */
    get key()
    {
        return this._key;
    }

    /**
     * Get the Provider's type
     *
     * @returns {string}
     */
    get type()
    {
        let types = {
            "analytics":    "Analytics",
            "testing":      "UX Testing",
            "tagmanager":   "Tag Manager",
            "visitorid":    "Visitor Identification",
            "marketing":    "Marketing"
        };
        return types[this._type] || "Unknown";
    }

    /**
     * Retrieve the keywords for searching
     *
     * @returns {[]}
     */
    get keywords()
    {
        return this._keywords;
    }

    /**
     * Get the Provider's RegExp pattern
     *
     * @returns {RegExp}
     */
    get pattern()
    {
        return this._pattern;
    }

    /**
     * Get the Provider's name
     *
     * @returns {string}
     */
    get name()
    {
        return this._name;
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {};
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {};
    }

    /**
     * Check if this provider should parse the given URL
     *
     * @param {string}  rawUrl   A URL to check against
     *
     * @returns {Boolean}
     */
    checkUrl(rawUrl)
    {
        return this.pattern.test(rawUrl);
    }

    /**
     * Parse a given URL into human-readable output
     *
     * @param {string}  rawUrl      A URL to check against
     * @param {string}  postData    POST data, if applicable
     *
     * @return {{provider: {name: string, key: string, type: string}, data: Array}}
     */
    parseUrl(rawUrl, postData = "")
    {
        let url = new URL(rawUrl),
            data = [],
            params = new URLSearchParams(url.search),
            postParams = this.parsePostData(postData);

        // Handle POST data first, if applicable (treat as query params)
        postParams.forEach((pair) => {
            params.append(pair[0], pair[1]);
        });

        for(let param of params)
        {
            let key = param[0],
                value = param[1],
                result = this.handleQueryParam(key, value);
            if(typeof result === "object") {
                data.push(result);
            }
        }

        let customData = this.handleCustom(url, params);
        if(typeof customData === "object" && customData !== null)
        {
            if(customData.length) {
                data = data.concat(customData);
            } else {
                data.push(customData);
            }
        }

        return {
            "provider": {
                "name":    this.name,
                "key":     this.key,
                "type":    this.type,
                "columns": this.columnMapping,
                "groups":  this.groups
            },
            "data": data
        };
    }

    /**
     * Parse any POST data into param key/value pairs
     *
     * @param postData
     * @return {Array|Object}
     */
    parsePostData(postData = "")
    {
        let params = [],
            parsed = {};
        if(typeof postData === "string" && postData)
        {
            try
            {
                parsed = JSON.parse(postData);
                /* Based on https://stackoverflow.com/a/19101235 */
                let recurse = (cur, prop) =>
                {
                    if (Object(cur) !== cur)
                    {
                        params.push([prop, cur]);
                    }
                    else if (Array.isArray(cur))
                    {
                        for(var i=0, l=cur.length; i<l; i++)
                        {
                            recurse(cur[i], prop + "[" + i + "]");
                        }
                        if (l === 0)
                        {
                            params.push([prop, ""]);
                        }
                    }
                    else
                    {
                        let isEmpty = true;
                        for (let p in cur)
                        {
                            if (!Object.prototype.hasOwnProperty.call(cur, p)) { continue; }
                            isEmpty = false;
                            recurse(cur[p], prop ? prop+"."+p : p);
                        }
                        if (isEmpty && prop)
                        {
                            params.push([prop, ""]);
                        }
                    }
                };
                recurse(parsed, "");
            }
            catch(e)
            {
                console.error("postData is not JSON", e.message);
            }
        }
        else if(typeof postData === "object" && postData)
        {
            // Form data type
            Object.entries(postData).forEach((entry) => {
                params.push([entry[0], entry[1].toString()]);
            });
        }
        return params;
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     * @returns {{}}
     */
    handleQueryParam(name, value)
    {
        let param = this.keys[name] || {};
        if(!param.hidden) {
            return {
                "key":   name,
                "field": param.name || name,
                "value": value,
                "group": param.group || "other"
            };
        }
    }

    
    urlMatch(rawUrl)
    {
        var patt = new RegExp(this._pattern);
        var res = patt.test(rawUrl);
        return res;
    }
    
    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {void|Array}
     */
    handleCustom(url, params)
    {

    }
}


 

/**
 * Adobe Analytics
 * http://www.adobe.com/data-analytics-cloud/analytics.html
 *
 * @class
 * @extends BaseProvider
 */
class AdobeAnalyticsProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "ADOBEANALYTICS";
        this._pattern    = /^([^#?]+)(\/b\/ss\/)|\.2o7\.net\/|\.sc\d?\.omtrdc\.net\/(?!id)/;
        this._name       = "Adobe Analytics";
        this._type       = "analytics";
        this._keywords   = ["aa", "site catalyst", "sitecatalyst", "omniture"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "account":      "rsid",
            "requestType":  "requestType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [
            {
                "key": "general", 
                "name": "General"
            }, 
            {
                "key": "props",
                "name": "Custom Traffic Variables (props)"
            }, 
            {
                "key": "eVars",
                "name": "Custom Conversion Variables (eVars)"
            },
            {
                "key": "listvar",
                "name": "List Variables"
            },
            {
                "key": "hier",
                "name": "Hierarchy Variables"
            }, 
            {
                "key": "media",
                "name": "Media Module"
            }, 
            {
                "key": "activity",
                "name": "Activity Map"
            }, 
            {
                "key": "context",
                "name": "Context Data"
            },
            {
                "key": "customerid",
                "name": "Customer ID"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {
            "ns": {
                "name": "Visitor namespace",
                "group": "general"
            },
            "ndh": {
                "name": "Image sent from JS?",
                "group": "other"
            },
            "ch": {
                "name": "Channel",
                "group": "general"
            },
            "r": {
                "name": "Referrer URL",
                "group": "general"
            },
            "ce": {
                "name": "Character set",
                "group": "general"
            },
            "cl": {
                "name": "Cookie lifetime",
                "group": "other"
            },
            "g": {
                "name": "Current URL",
                "group": "general"
            },
            "bw": {
                "name": "Browser width",
                "group": "other"
            },
            "bh": {
                "name": "Browser height",
                "group": "other"
            },
            "s": {
                "name": "Screen resolution",
                "group": "other"
            },
            "c": {
                "name": "Screen color depth",
                "group": "other"
            },
            "ct": {
                "name": "Connection type",
                "group": "other"
            },
            "p": {
                "name": "Netscape plugins",
                "group": "other"
            },
            "k": {
                "name": "Cookies enabled?",
                "group": "other"
            },
            "hp": {
                "name": "Home page?",
                "group": "other"
            },
            "pid": {
                "name": "Page ID",
                "group": "general"
            },
            "pidt": {
                "name": "Page ID type",
                "group": "general"
            },
            "oid": {
                "name": "Object ID",
                "group": "general"
            },
            "oidt": {
                "name": "Object ID type",
                "group": "general"
            },
            "ot": {
                "name": "Object tag name",
                "group": "general"
            },
            "pe": {
                "name": "Link type",
                "group": "general"
            },
            "pev1": {
                "name": "Link URL",
                "group": "general"
            },
            "pev2": {
                "name": "Link name",
                "group": "general"
            },
            "pev3": {
                "name": "Video milestone",
                "group": "general"
            },
            "cc": {
                "name": "Currency code",
                "group": "general"
            },
            "t": {
                "name": "Browser time",
                "group": "other"
            },
            "v": {
                "name": "Javascript-enabled browser?",
                "group": "other"
            },
            "pccr": {
                "name": "Prevent infinite redirects",
                "group": "other"
            },
            "vid": {
                "name": "Visitor ID",
                "group": "general"
            },
            "vidn": {
                "name": "New visitor ID",
                "group": "general"
            },
            "fid": {
                "name": "Fallback Visitor ID",
                "group": "general"
            },
            "mid": {
                "name": "Marketing Cloud Visitor ID",
                "group": "general"
            },
            "mcorgid ": {
                "name": "Marketing Cloud Org ID",
                "group": "general"
            },
            "aid": {
                "name": "Legacy Visitor ID",
                "group": "general"
            },
            "cdp": {
                "name": "Cookie domain periods",
                "group": "general"
            },
            "pageName": {
                "name": "Page name",
                "group": "general"
            },
            "pageType": {
                "name": "Page type",
                "group": "general"
            },
            "server": {
                "name": "Server",
                "group": "general"
            },
            "events": {
                "name": "Events",
                "group": "general"
            },
            "products": {
                "name": "Products",
                "group": "general"
            },
            "purchaseID": {
                "name": "Purchase ID",
                "group": "general"
            },
            "state": {
                "name": "Visitor state",
                "group": "general"
            },
            "vmk": {
                "name": "Visitor migration key",
                "group": "other"
            },
            "vvp": {
                "name": "Variable provider",
                "group": "other"
            },
            "xact": {
                "name": "Transaction ID",
                "group": "general"
            },
            "zip": {
                "name": "ZIP/Postal code",
                "group": "general"
            },
            "rsid": {
                "name": "Report Suites",
                "group": "general"
            },
            "requestType": {
                "hidden": true
            }
        };
    }

    /**
     * Parse a given URL into human-readable output
     *
     * @param {string}  rawUrl   A URL to check against
     * @param {string}  postData    POST data, if applicable
     *
     * @return {{provider: {name: string, key: string, type: string}, data: Array}}
     */
    parseUrl(rawUrl, postData = "")
    {
        let url = new URL(rawUrl),
            data = [],
            stacked = [],
            params = new URLSearchParams(url.search),
            postParams = this.parsePostData(postData);

        // Handle POST data first, if applicable (treat as query params)
        postParams.forEach((pair) => {
            params.append(pair[0], pair[1]);
        });

        for(let param of params)
        {
            let key = param[0],
                value = param[1];

            // Stack context data params
            if (/\.$/.test(key)) {
                stacked.push(key);
                continue;
            }
            if (/^\./.test(key)) {
                stacked.pop();
                continue;
            }

            let stackedParam = stacked.join("") + key,
                result = this.handleQueryParam(stackedParam, value);
            if(typeof result === "object") {
                data.push(result);
            }
        }

        data = data.concat(this.handleCustom(url, params));

        return {
            "provider": {
                "name": this.name,
                "key":  this.key,
                "type": this.type,
                "columns": this.columnMapping,
                "groups":  this.groups
            },
            "data": data
        };
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     *
     * @returns {void|{}}
     */
    handleQueryParam(name, value)
    {
        let result = {};
        if(/^(?:c|prop)(\d+)$/i.test(name)) {
            result = {
                "key":   name,
                "field": "prop" + RegExp.$1,
                "value": value,
                "group": "props"
            };
        } else if(/^(?:v|eVar)(\d+)$/i.test(name)) {
            result = {
                "key":   name,
                "field": "eVar" + RegExp.$1,
                "value": value,
                "group": "eVars"
            };
        } else if(/^(?:h|hier)(\d+)$/i.test(name)) {
            result = {
                "key":   name,
                "field": "Hierarchy " + RegExp.$1,
                "value": value,
                "group": "hier"
            };
        } else if(/^(?:l|list)(\d+)$/i.test(name)) {
            result = {
                "key":   name,
                "field": "List Var " + RegExp.$1,
                "value": value,
                "group": "listvar"
            };
        } else if(name.indexOf(".a.media.") > 0) {
            result = {
                "key":   name,
                "field": name.split(".").pop(),
                "value": value,
                "group": "media"
            };
        } else if(name.indexOf(".a.activitymap.") > 0) {
            result = {
                "key":   name,
                "field": name.split(".").pop(),
                "value": value,
                "group": "activity"
            };
        } else if(name.indexOf("cid.") === 0) {
            result = {
                "key":   name,
                "field": name.replace("cid.", ""),
                "value": value,
                "group": "customerid"
            };
        } else if(name.indexOf(".") > 0) {
            result = {
                "key":   name,
                "field": name.replace("c.", ""),
                "value": value,
                "group": "context"
            };
        } else if(/^(AQB|AQE)$/i.test(name)) {
            // ignore
            return;
        } else {
            result = super.handleQueryParam(name, value);
        }
        return result;
    }

    /**
     * Parse any POST data into param key/value pairs
     *
     * @param postData
     * @return {Array|Object}
     */
    parsePostData(postData = "") {
        let params = [];
        // Handle POST data first, if applicable (treat as query params)
        if (typeof postData === "string" && postData !== "") {
            let keyPairs = postData.split("&");
            keyPairs.forEach((keyPair) => {
                let splitPair = keyPair.split("=");
                params.push([splitPair[0], decodeURIComponent(splitPair[1] || "")]);
            });
        } else if (typeof postData === "object") {
            Object.entries(postData).forEach((entry) => {
                // @TODO: consider handling multiple values passed?
                params.push([entry[0], entry[1].toString()]);
            });
        }
        return params;
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params)
    {
        let results = [],
            rsid = url.pathname.match(/\/b\/ss\/([^/]+)\//),
            jsVersion = url.pathname.match(/\/(JS-[^/]+)\//i),
            pev2 = params.get("pe"),
            requestType = "Page View";
        if(rsid) {
            results.push({
                "key":   "rsid",
                "field": this.keys.rsid ? this.keys.rsid.name : "Report Suites",
                "value": rsid[1],
                "group": this.keys.rsid ? this.keys.rsid.group : "general",
            });
        }
        if(jsVersion) {
            results.push({
                "key":   "version",
                "field": this.keys.version ? this.keys.version.name : "JavaScript Version",
                "value": jsVersion[1],
                "group": this.keys.version ? this.keys.version.group : "general",
            });
        }
        results.push({
            "key":   "trackingServer",
            "field": "Tracking Server",
            "value": url.hostname,
            "group": "general",
        });

        // Handle s.tl calls
        if(pev2 === "lnk_e") {
            requestType = "Exit Click";
        } else if(pev2 === "lnk_d") {
            requestType = "Download Click";
        } else if(pev2 === "lnk_o") {
            requestType = "Other Click";
        } else if(/^m_/.test(pev2)) {
            requestType = "Media";
        }
        results.push({
            "key":   "requestType",
            "value": requestType,
            "hidden": true
        });
        return results;
    }
}
/**
 * Adobe Audience Manager
 * http://www.adobe.com/data-analytics-cloud/audience-manager.html
 *
 * @class
 * @extends BaseProvider
 */
class AdobeAudienceManagerProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "ADOBEAUDIENCEMANAGER";
        this._pattern    = /demdex\.net\/(ibs|event)[?/#:]/;
        this._name       = "Adobe Audience Manager";
        this._type       = "visitorid";
        this._keywords   = ["aam"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "requestType": "omnibug_requestType",
            "account": "omnibug_account"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [
            {
                "key": "general",
                "name": "General"
            },
            {
                "key": "customer",
                "name": "Customer Attributes"
            },
            {
                "key": "private",
                "name": "Private Attributes"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {
            "caller": {
                "name": "Caller",
                "group": "general"
            },
            "cb": {
                "name": "Callback property",
                "group": "general"
            },
            "cid": {
                "name": "Data Provider (User) IDs",
                "group": "general"
            },
            "ciic": {
                "name": "Integration Code / User ID",
                "group": "general"
            },
            "coppa": {
                "name": "COPPA Request",
                "group": "general"
            },
            "cts": {
                "name": "Return Traits & Segments in Response",
                "group": "general"
            },
            "dpid": {
                "name": "Data Provider ID",
                "group": "general"
            },
            "dpuuid": {
                "name": "Data Provider User ID",
                "group": "general"
            },
            "dst": {
                "name": "Return URL Destination in Response",
                "group": "general"
            },
            "dst_filter": {
                "name": "Adobe Analytics Integration",
                "group": "general"
            },
            "jsonv": {
                "name": "JSON Response Version",
                "group": "general"
            },
            "mid": {
                "name": "Experience Cloud ID",
                "group": "general"
            },
            "nsid": {
                "name": "Name Space ID",
                "group": "general"
            },
            "ptfm": {
                "name": "Platform",
                "group": "general"
            },
            "rs": {
                "name": "Legacy Adobe Analytics Integration",
                "group": "general"
            },
            "rtbd": {
                "name": "Return Method",
                "group": "general"
            },
            "sid": {
                "name": "Score ID",
                "group": "general"
            },
            "tdpid": {
                "name": "Trait Source",
                "group": "general"
            },
            "tdpiic": {
                "name": "Trait Source (Integration Code)",
                "group": "general"
            },
            "uuid": {
                "name": "Unique User ID",
                "group": "general"
            },
        };
    }

    /**
     * Parse a given URL into human-readable output
     *
     * @param {string}  rawUrl      A URL to check against
     * @param {string}  postData    POST data, if applicable
     *
     * @return {{provider: {name: string, key: string, type: string}, data: Array}}
     */
    parseUrl(rawUrl, postData = "")
    {
        let url = new URL(rawUrl),
            data = [],
            params = new URLSearchParams(url.search);

        // Force Adobe's path into query strings
        if(url.pathname.indexOf("/ibs:") === 0) {
            url.pathname.replace("/ibs:", "").split("&").forEach(param => {
                let pair = param.split("=");
                params.append(pair[0], pair[1]);
            });
        }
        for(let param of params)
        {
            let key = param[0],
                value = param[1],
                result = this.handleQueryParam(key, value);
            if(typeof result === "object") {
                data.push(result);
            }
        }

        let customData = this.handleCustom(url, params);
        /* istanbul ignore else */
        if(typeof customData === "object" && customData !== null)
        {
            data = data.concat(customData);
        }

        return {
            "provider": {
                "name":    this.name,
                "key":     this.key,
                "type":    this.type,
                "columns": this.columnMapping,
                "groups":  this.groups
            },
            "data": data
        };
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     *
     * @returns {void|{}}
     */
    handleQueryParam(name, value)
    {
        let result = {};
        if(/^c_(.+)$/i.test(name)) {
            result = {
                "key":   name,
                "field": name,
                "value": value,
                "group": "custom"
            };
        } else if(/^p_(.+)$/i.test(name)) {
            result = {
                "key":   name,
                "field": name,
                "value": value,
                "group": "private"
            };
        } else if(/^d_(.+)$/i.test(name) && this.keys[RegExp.$1]) {
            result = {
                "key":   name,
                "field": this.keys[RegExp.$1].name,
                "value": value,
                "group": this.keys[RegExp.$1].group
            };
        } else {
            result = super.handleQueryParam(name, value);
        }
        return result;
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params)
    {
        let results = [],
            accountID = url.hostname.replace(/^(dpm)?.demdex.net/i, ""),
            requestType = url.pathname.match(/^\/([^?/#:]+)/);
        results.push({
            "key":   "omnibug_account",
            "value": accountID,
            "hidden": true
        });

        if(requestType[1] === "ibs") {
            requestType = "ID Sync";
        } else if(requestType[1] === "event") {
            requestType = "Event";
        } else {
            requestType = requestType[1];
        }
        results.push({
            "key":   "omnibug_requestType",
            "value": requestType,
            "hidden": true
        });
        return results;
    }
}
/**
 * Adobe Dynamic Tag Manager (DTM)
 * https://dtm.adobe.com/
 *
 * @class
 * @extends BaseProvider
 */
class AdobeDynamicTagManagerProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "ADOBEDTM";
        this._pattern    = /\/satelliteLib-[^.]+\.js/;
        this._name       = "Adobe Dynamic Tag Manager";
        this._type       = "tagmanager";
        this._keywords   = ["dtm", "activate", "activation", "tms"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "account":      "environment",
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [
            {
                "key": "general",
                "name": "General"
            }
        ];
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {void|Array}
     */
    handleCustom(url, params)
    {
        let matches =  url.pathname.match(/\/satelliteLib-[^.-]+(-staging)?\.js/),
            env = (matches && matches[1]) ? matches[1].replace("-", "") : "production",
            results = [];
        results.push({
            "key":   "environment",
            "field": "DTM Environment",
            "value": env,
            "group": "general"
        });

        return results;
    }
}
/**
 * Adobe Experience ID Service
 * http://www.adobe.com/data-analytics-cloud/audience-manager.html
 *
 * @class
 * @extends BaseProvider
 */
class AdobeExperienceIDProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "ADOBEEXPERIENCEID";
        this._pattern    = /\/id\?(?=.*d_visid_ver=)(?=.*(d_orgid|mcorgid)=)/;
        this._name       = "Adobe Experience Cloud ID";
        this._type       = "visitorid";
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "requestType": "omnibug_requestType",
            "account": "omnibug_account"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [
            {
                "key": "general",
                "name": "General"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {
            "d_orgid": {
                "name": "Adobe Organization ID",
                "group": "general"
            },
            "d_rtbd": {
                "name": "Return Method",
                "group": "general"
            },
            "d_cb": {
                "name": "Callback property",
                "group": "general"
            },
            "mcorgid": {
                "name": "Adobe Organization ID",
                "group": "general"
            },
            "d_visid_ver": {
                "name": "Experience Cloud ID Version",
                "group": "general"
            },
            "d_cid_ic": {
                "name": "Integration Code / User ID",
                "group": "general"
            },
        };
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params)
    {
        let results = [],
            accountID = "";
        if(params.get("d_orgid")) {
            accountID = params.get("d_orgid");
        } else if(params.get("mcorgid")) {
            accountID = params.get("mcorgid");
        }
        results.push({
            "key":   "omnibug_account",
            "value": accountID,
            "hidden": true
        });
        return results;
    }
}
/**
 * Adobe Heartbeat
 * https://marketing.adobe.com/resources/help/en_US/sc/appmeasurement/hbvideo/
 *
 * @class
 * @extends BaseProvider
 */
class AdobeHeartbeatProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "ADOBEHEARTBEAT";
        this._pattern    = /\.hb\.omtrdc\.net\//;
        this._name       = "Adobe Heartbeat";
        this._type       = "analytics";
        this._keywords   = ["video"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "account":      "s:sc:rsid",
            "requestType":  "omnibug_requestType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [
            {
                "key": "general",
                "name": "General"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {
            "s:asset:video_id": {
                "name": "Content ID",
                "group": "general"
            },
            "l:asset:length": {
                "name": "Video Length",
                "group": "general"
            },
            "s:stream:type": {
                "name": "Content Type",
                "group": "general"
            },
            "s:event:sid": {
                "name": "Video Session ID",
                "group": "general"
            },
            "s:sp:player_name": {
                "name": "Content Player Name",
                "group": "general"
            },
            "s:sp:channel": {
                "name": "Content Channel",
                "group": "general"
            },
            "s:asset:name": {
                "name": "Video Name",
                "group": "general"
            },
            "s:sp:sdk": {
                "name": "SDK Version",
                "group": "general"
            },
            "s:sp:hb_version": {
                "name": "VHL Version",
                "group": "general"
            },
            "s:meta:a.media.show": {
                "name": "Show",
                "group": "general"
            },
            "s:meta:a.media.format": {
                "name": "Stream Format",
                "group": "general"
            },
            "s:meta:a.media.season": {
                "name": "Season",
                "group": "general"
            },
            "s:meta:a.media.episode": {
                "name": "Episode",
                "group": "general"
            },
            "s:meta:a.media.asset": {
                "name": "Asset ID",
                "group": "general"
            },
            "s:meta:a.media.genre": {
                "name": "Genre",
                "group": "general"
            },
            "s:meta:a.media.airDate": {
                "name": "First Air Date",
                "group": "general"
            },
            "s:meta:a.media.digitalDate": {
                "name": "First Digital Date",
                "group": "general"
            },
            "s:meta:a.media.rating": {
                "name": "Content Rating",
                "group": "general"
            },
            "s:meta:a.media.originator": {
                "name": "Originator",
                "group": "general"
            },
            "s:meta:a.media.network": {
                "name": "Network",
                "group": "general"
            },
            "s:meta:a.media.type": {
                "name": "Show Type",
                "group": "general"
            },
            "s:meta:a.media.pass.mvpd": {
                "name": "MVPD",
                "group": "general"
            },
            "s:meta:a.media.pass.auth": {
                "name": "Authorized",
                "group": "general"
            },
            "s:meta:a.media.dayPart": {
                "name": "Day Part",
                "group": "general"
            },
            "s:meta:a.media.feed": {
                "name": "Video Feed Type",
                "group": "general"
            },
            "s:meta:a.media.adload": {
                "name": "Ad Load Type",
                "group": "general"
            },
            "s:event:type": {
                "name": "Event Type",
                "group": "general"
            },
            "omnibug_requestType": {
                "hidden": true
            }
        };
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params)
    {
        let results = [],
            event = params.get("s:event:type");
        results.push({
            "key":   "omnibug_requestType",
            "value": event.charAt(0).toUpperCase() + event.slice(1),
            "hidden": true
        });
        return results;
    }
}
/**
 * Adobe Launch
 * https://launch.adobe.com/
 *
 * @class
 * @extends BaseProvider
 */
class AdobeLaunchProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "ADOBELAUNCH";
        this._pattern    = /assets\.adobedtm\.com\/launch-[^?#]+.js/;
        this._name       = "Adobe Launch";
        this._type       = "tagmanager";
        this._keywords   = ["activate", "activation", "tms"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "account":      "environment",
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [
            {
                "key": "general",
                "name": "General"
            }
        ];
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {void|Array}
     */
    handleCustom(url, params)
    {
        let matches =  url.pathname.match(/\/launch-[^.-]+(-[^.]+)(?:\.min)?\.js/),
            env = (matches && matches[1]) ? matches[1].replace("-", "") : "production",
            results = [];
        results.push({
            "key":   "environment",
            "field": "Launch Environment",
            "value": env,
            "group": "general"
        });

        return results;
    }
}
/**
 * Adobe Target
 * http://www.adobe.com/marketing-cloud/target.html
 *
 * @class
 * @extends BaseProvider
 */
class AdobeTargetProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "ADOBETARGET";
        this._pattern    = /\.tt\.omtrdc\.net\/(?!cdn\/)/;
        this._name       = "Adobe Target";
        this._type       = "testing";
        this._keywords   = ["test target", "test & target", "at", "tnt", "t&t", "omniture"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "account":      "mbox",
            "requestType":  "mboxType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [
            {
                "key": "general",
                "name": "General"
            },
            {
                "key": "profile",
                "name": "Profile Attributes"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {
            "mbox": {
                "name": "Mbox Name",
                "group": "general"
            },
            "mboxType": {
                "name": "Mbox Type",
                "group": "general"
            },
            "mboxCount": {
                "name": "Mbox Count",
                "group": "general"
            },
            "mboxId": {
                "name": "Mbox ID",
                "group": "general"
            },
            "mboxSession": {
                "name": "Mbox Session",
                "group": "general"
            },
            "mboxPC": {
                "name": "Mbox PC ID",
                "group": "general"
            },
            "mboxPage": {
                "name": "Mbox Page ID",
                "group": "general"
            },
            "clientCode": {
                "name": "Client Code",
                "group": "general"
            },
            "mboxHost": {
                "name": "Page Host",
                "group": "general"
            },
            "mboxURL": {
                "name": "Page URL",
                "group": "general"
            },
            "mboxReferrer": {
                "name": "Page Referrer",
                "group": "general"
            },
            "screenHeight": {
                "name": "Screen Height",
                "group": "general"
            },
            "screenWidth": {
                "name": "Screen Width",
                "group": "general"
            },
            "browserWidth": {
                "name": "Browser Width",
                "group": "general"
            },
            "browserHeight": {
                "name": "Browser Height",
                "group": "general"
            },
            "browserTimeOffset": {
                "name": "Browser Timezone Offset",
                "group": "general"
            },
            "colorDepth": {
                "name": "Browser Color Depth",
                "group": "general"
            },
            "mboxXDomain": {
                "name": "CrossDomain Enabled",
                "group": "general"
            },
            "mboxTime": {
                "name": "Timestamp",
                "group": "general"
            },
            "mboxVersion": {
                "name": "Library Version",
                "group": "general"
            }
        };
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     *
     * @returns {void|{}}
     */
    handleQueryParam(name, value)
    {
        let result = {};
        if(name.indexOf("profile.") === 0) {
            result = {
                "key":   name,
                "field": name.slice(8),
                "value": value,
                "group": "profile"
            };
        } else {
            result = super.handleQueryParam(name, value);
        }
        return result;
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {void|Array}
     */
    handleCustom(url, params)
    {
        let matches =  url.pathname.match( /\/([^/]+)\/mbox\/([^/?]+)/ ),
            results = [];
        if(matches !== null && matches.length === 3) {
            results.push({
                "key":   "clientCode",
                "field": "Client Code",
                "value": matches[1],
                "group": "general"
            });
            results.push({
                "key":   "mboxType",
                "field": "Mbox Type",
                "value": matches[2],
                "group": "general"
            });
        }

        return results;
    }
}

/**
 * Bing Ads UET
 * https://about.ads.microsoft.com/en-us/solutions/audience-targeting/universal-event-tracking
 *
 * @class
 * @extends BaseProvider
 */
class BingAdsProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "BINGUET";
        this._pattern = /bat\.bing\.com\/action/;
        this._name = "Bing Ads";
        this._type = "marketing";
        this._keywords = ["UET", "uetq", "Microsoft", "MSN", "atdmt", "bat.js"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "ti",
            "requestType": "requestType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups() {
        return [
            {
                "key": "general",
                "name": "General"
            },
            {
                "key": "events",
                "name": "Events"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys() {
        return {
            "ti": {
                "name": "Tag ID",
                "group": "general"
            },
            "ec": {
                "name": "Event Category",
                "group": "events"
            },
            "ea": {
                "name": "Event Action",
                "group": "events"
            },
            "el": {
                "name": "Event Label",
                "group": "events"
            },
            "ev": {
                "name": "Event Value",
                "group": "events"
            },
            "gv": {
                "name": "Goal Revenue",
                "group": "events"
            },
            "prodid": {
                "name": "Product ID",
                "group": "events"
            },
            "pagetype": {
                "name": "Page Type",
                "group": "general"
            },
            "evt": {
                "name": "Event Type",
                "group": "general"
            },
            "spa": {
                "name": "Single Page App",
                "group": "general"
            },
            "page_path": {
                "name": "Page Path",
                "group": "general"
            },
            "p": {
                "name": "Page URL",
                "group": "general"
            },
            "tl": {
                "name": "Page Title",
                "group": "other"
            },
            "kw": {
                "name": "Keywords Meta Tag",
                "group": "other"
            },
            "r": {
                "name": "Page Referrer",
                "group": "other"
            }
        };
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params) {
        let results = [],
            event = params.get("evt"),
            requestType = "other";

        if (event === "pageLoad") {
            requestType = "Page View";
        } else {
            requestType = event.charAt(0).toUpperCase() + event.slice(1);
        }

        results.push({
            "key": "requestType",
            "value": requestType,
            "hidden": true
        });

        return results;
    }
}


/**
 * Criteo OneTag
 * https://www.criteo.com/
 *
 * @class
 * @extends BaseProvider
 */

class CriteoOneTagProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "CRITEOONETAG";
        this._pattern = /sslwidget\.criteo\.com\/event/;
        this._name = "Criteo OneTag";
        this._type = "marketing";
    }

    /**
   * Retrieve the column mappings for default columns (account, event type)
   *
   * @return {{}}
   */
    get columnMapping() {
        return {
            account: "a",
            requestType: "requestType"
        };
    }

    /**
   * Retrieve the group names & order
   *
   * @returns {*[]}
   */
    get groups() {
        return [
            {
                key: "general",
                name: "General"
            },
            {
                key: "events",
                name: "Events"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys() {
        return {
            "a": {
                "name": "Account ID",
                "group": "general"
            },
            "v": {
                "name": "Tag Version",
                "group": "other"
            },
            "tld": {
                "name": "Top-Level Domain",
                "group": "other"
            }
        };
    }

    /**
   * Parse a given URL parameter into human-readable form
   *
   * @param {string}  name
   * @param {string}  value
   *
   * @returns {void|{}}
   */
    handleQueryParam(name, value) {
        let result = {}, x = false;
        if (x) {
            // do nothing
        } else {
            result = super.handleQueryParam(name, value);
        }
        return result;
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params) {
        let results = [],
            requestType = [];

        // Grab the request type - in the future we'll attempt to better parse the actual results
        params.forEach((value, key) => {
            if (/^p\d+$/.test(key)) {
                let values = value.split("&");
                if (/^e=/.test(values[0])) {
                    let type = this._handleEventName(values[0].split("=")[1]);
                    if (type) {
                        requestType.push(type);
                    }
                }
            }
        });

        results.push({
            "key": "requestType",
            "value": requestType.length ? requestType.join(" | ") : "other",
            "hidden": true
        });

        return results;
    }

    _handleEventName(name) {
        let lookupTable = {
            "vh": "Homepage",
            "vl": "Search Listing View",
            "vp": "Product View",
            "vb": "Cart View",
            "vc": "Purchase"
        };
        return lookupTable[name] ? lookupTable[name] : false;
    }
}

/**
 * Ensighten Manage
 * https://www.ensighten.com/products/enterprise-tag-management/
 *
 * @class
 * @extends BaseProvider
 */

class FacebookPixelProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "FACEBOOKPIXEL";
        this._pattern    = /facebook\.com\/tr\/?(?!.*&ev=microdata)\?/i;
        this._name       = "Facebook Pixel";
        this._type       = "marketing";
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "account":      "id",
            "requestType":  "requestType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [
            {
                "key": "general",
                "name": "General"
            },
            {
                "key": "custom",
                "name": "Event Data"
            },
            {
                "key": "products",
                "name": "Products"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {
            "id": {
                "name": "Account ID",
                "group": "general"
            },
            "ev": {
                "name": "Event Type",
                "group": "general"
            },
            "dl": {
                "name": "Page URL",
                "group": "general"
            },
            "rl": {
                "name": "Referring URL",
                "group": "general"
            },
            "ts": {
                "name": "Timestamp",
                "group": "general"
            },
            "sw": {
                "name": "Screen Width",
                "group": "other"
            },
            "sh": {
                "name": "Screen Height",
                "group": "other"
            },
            "v": {
                "name": "Pixel Version",
                "group": "other"
            },
            "ec": {
                "name": "Event Count",
                "group": "other"
            },
            "if": {
                "name": "In an iFrame",
                "group": "other"
            },
            "it": {
                "name": "Initialized Timestamp",
                "group": "other"
            },
            "r": {
                "name": "Code Branch",
                "group": "other"
            },
            "cd[content_name]": {
                "name": "Content Name",
                "group": "custom"
            },
            "cd[content_category]": {
                "name": "Content Category",
                "group": "custom"
            },
            "cd[content_ids]": {
                "name": "Product IDs",
                "group": "products"
            },
            "cd[content_type]": {
                "name": "Content Type",
                "group": "custom"
            },
            "cd[num_items]": {
                "name": "Quantity",
                "group": "custom"
            },
            "cd[search_string]": {
                "name": "Search Keyword",
                "group": "custom"
            },
            "cd[status]": {
                "name": "Registration Status",
                "group": "custom"
            },
            "cd[value]": {
                "name": "Value",
                "group": "custom"
            },
            "cd[currency]": {
                "name": "Currency",
                "group": "custom"
            },
            "ud[uid]": {
                "name": "User ID",
                "group": "general"
            }
        };
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     *
     * @returns {void|{}}
     */
    handleQueryParam(name, value)
    {
        let result = {};
        if(name === "cd[contents]") {
            // do handling in custom
        } else if(!this.keys[name] && name.indexOf("cd[") === 0) {
            result = {
                "key":   name,
                "field": name.replace(/^cd\[|\]$/g, ""),
                "value": value,
                "group": "custom"
            };
        } else {
            result = super.handleQueryParam(name, value);
        }
        return result;
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {void|Array}
     */
    handleCustom(url, params)
    {
        let results = [],
            content = params.get("cd[contents]"),
            requestType = params.get("ev") || "";
        if(content) {
            try {
                let jsonData = JSON.parse(content);
                if(jsonData && jsonData.length) {
                    let keyMapping = {
                        "id": "ID",
                        "item_price": "Price",
                        "quantity": "Quantity"
                    };
                    jsonData.forEach((product, index) => {
                        Object.entries(product).forEach(([key, value]) => {
                            results.push({
                                "key": `cd[contents][${index}][${key}]`,
                                "field": `Product ${index+1} ${keyMapping[key] || key}`,
                                "value": value,
                                "group": "products"
                            });
                        });
                    });
                }
            } catch(e) {
                results.push({
                    "key": "cd[contents]",
                    "field": "Content",
                    "value": content,
                    "group": "products"
                });
            }
        }

        results.push({
            "key":   "requestType",
            "value": requestType.split(/(?=[A-Z])/).join(" "),
            "hidden": true
        });
        return results;
    }
}
/**
 * Google Ads
 * https://ads.google.com/
 *
 * @class
 * @extends BaseProvider
 */
class GoogleAdsProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "GOOGLEADS";
        this._pattern = /googleads\.g\.doubleclick\.net\/pagead\/(?:viewthrough)conversion/;
        this._name = "Google Ads";
        this._type = "marketing";
        this._keywords = ["aw", "ad words"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "omnibug-account",
            "requestType": "requestType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups() {
        return [
            {
                "key": "general",
                "name": "General"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys() {
        return {
            "url": {
                "name": "Page URL",
                "group": "general"
            },
            "tiba": {
                "name": "Page Title",
                "group": "general"
            },
            "data": {
                "name": "Event Data",
                "group": "general"
            },
            "label": {
                "name": "Conversion Label",
                "group": "general"
            }
        };
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params) {
        let results = [],
            pathParts = url.pathname.match(/\/([^/]+)\/(?:AW-)?(\d+)\/?$/),
            account = "AW-" + pathParts[2],
            data = params.get("data") || "",
            dataEvent = data.match(/event=([^;]+)(?:$|;)/),
            requestType = "";

        /* istanbul ignore else */
        if (account) {
            results.push({
                "key": "account",
                "field": "Account ID",
                "value": account,
                "group": "general"
            });

            // Add the conversion label, if available, to the accounts column
            if (params.get("label")) {
                account += "/" + params.get("label");
            }
            results.push({
                "key": "omnibug-account",
                "value": account,
                "hidden": true
            });
        }

        if (dataEvent && dataEvent.length) {
            if (dataEvent[1] === "gtag.config") {
                requestType = "Page View";
            } else {
                requestType = dataEvent[1];
            }
        } else {
            requestType = (pathParts[1] === "viewthroughconversion") ? "Conversion" : pathParts[1].replace("viewthrough", "");
        }

        results.push({
            "key": "requestType",
            "value": requestType,
            "field": "Request Type",
            "group": "general"
        });

        return results;
    }
}
/**
 * Google DoubleClick
 * https://marketingplatform.google.com/about/enterprise/
 *
 * @class
 * @extends BaseProvider
 */
class GoogleDoubleClickProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "DOUBLECLICK";
        this._pattern    = /(?:fls|ad)\.doubleclick\.net\/activityi(?!.*dc_pre);/;
        this._name       = "Google DoubleClick";
        this._type       = "marketing";
        this._keywords   = ["dc", "dcm"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "account":      "omnibug-account",
            "requestType":  "type"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [
            {
                "key": "general",
                "name": "General"
            },
            {
                "key": "custom",
                "name": "Custom Fields"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {
            "src": {
                "name": "Account ID",
                "group": "general"
            },
            "type": {
                "name": "Activity Group",
                "group": "general"
            },
            "cat": {
                "name": "Activity Tag",
                "group": "general"
            },
            "cost": {
                "name": "Value",
                "group": "general"
            },
            "qty": {
                "name": "Quantity",
                "group": "general"
            },
            "num": {
                "name": "Request Cache Buster",
                "group": "other"
            },
            "dc_lat": {
                "name": "Limit Ad Tracking",
                "group": "other"
            },
            "tag_for_child_directed_treatment": {
                "name": "COPPA Request",
                "group": "other"
            },
            "tfua": {
                "name": "User Underage",
                "group": "other"
            },
            "npa": {
                "name": "Opt-out of Remarketing",
                "group": "other"
            },
            "ord": {
                "hidden": true
            }
        };
    }

    /**
     * Parse a given URL into human-readable output
     *
     * @param {string}  rawUrl      A URL to check against
     * @param {string}  postData    POST data, if applicable
     *
     * @return {{provider: {name: string, key: string, type: string}, data: Array}}
     */
    parseUrl(rawUrl, postData = "")
    {
        let url = new URL(rawUrl),
            data = [],
            params = new URLSearchParams(url.search);

        // Force Google's path into query strings
        url.pathname.replace("/activityi;", "").split(";").forEach(param => {
            let pair = param.split("=");
            params.append(pair[0], pair[1]);
        });
        for(let param of params)
        {
            let key = param[0],
                value = param[1],
                result = this.handleQueryParam(key, value);
            if(typeof result === "object") {
                data.push(result);
            }
        }

        let customData = this.handleCustom(url, params);
        /* istanbul ignore else */
        if(typeof customData === "object" && customData !== null)
        {
            data = data.concat(customData);
        }

        return {
            "provider": {
                "name":    this.name,
                "key":     this.key,
                "type":    this.type,
                "columns": this.columnMapping,
                "groups":  this.groups
            },
            "data": data
        };
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     *
     * @returns {void|{}}
     */
    handleQueryParam(name, value)
    {
        let result = {};
        if(/^u(\d+)$/i.test(name)) {
            result = {
                "key": name,
                "field": "Custom Field " + RegExp.$1,
                "value": value,
                "group": "custom"
            };
        } else if(name === "~oref") {
            result = {
                "key": name,
                "field": "Page URL",
                "value": decodeURIComponent(value),
                "group": "general"
            };
        } else {
            result = super.handleQueryParam(name, value);
        }
        return result;
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params)
    {
        let results = [],
            account = "DC-" + params.get("src"),
            ord = params.get("ord"),
            countingMethod = "per_session";

        if(ord) {
            if(params.get("qty")) {
                results.push({
                    "key":   "ord",
                    "field": "Transaction ID",
                    "value": ord,
                    "group": "general"
                });
                countingMethod = "transactions / items_sold";
            } else {
                results.push({
                    "key":   "ord",
                    "field": "Counting Method Type",
                    "value": ord,
                    "group": "other"
                });
                countingMethod = (ord === "1") ? "unique" : "standard";
            }
        }

        results.push({
            "key":   "countingMethod",
            "field": "Counting Method",
            "value": countingMethod,
            "group": "general"
        });

        // Add the type & category, if available, to the accounts column
        /* istanbul ignore else */
        if(params.get("type") && params.get("cat")) {
            account += "/" + params.get("type") + "/" + params.get("cat");
        }
        results.push({
            "key":   "omnibug-account",
            "value": account,
            "hidden": true
        });

        return results;
    }
}
/**
 * Google Tag Manager
 * https://tagmanager.google.com/
 *
 * @class
 * @extends BaseProvider
 */
class GoogleTagManagerProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "GOOGLETAGMAN";
        this._pattern    = /googletagmanager\.com\/gtm\.js/;
        this._name       = "Google Tag Manager";
        this._type       = "tagmanager";
        this._keywords   = ["tms"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "account":      "id"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [
            {
                "key": "general",
                "name": "General"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {
            "id": {
                "name": "Account ID",
                "group": "general"
            },
            "l": {
                "name": "Data Layer Variable",
                "group": "general"
            }
        };
    }
}
/**
 * LinkedIn Conversions
 * https://business.linkedin.com/marketing-solutions/insight-tag
 *
 * @class
 * @extends BaseProvider
 */
class LinkedInProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "LINKEDINPIXEL";
        this._pattern = /px\.ads\.linkedin\.com\/collect/;
        this._name = "LinkedIn Conversion";
        this._type = "marketing";
        this._keywords = ["li", "linkedin", "insight", "licdn"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "pid",
            "requestType": "requestType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups() {
        return [
            {
                "key": "general",
                "name": "General"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys() {
        return {
            "pid": {
                "name": "Pixel ID",
                "group": "general"
            },
            "conversionId": {
                "name": "Conversion ID",
                "group": "other"
            },
            "time": {
                "name": "Timestamp",
                "group": "other"
            },
            "fmt": {
                "name": "Pixel Type",
                "group": "other"
            },
            "url": {
                "name": "Page URL",
                "group": "other"
            }
        };
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params) {
        let results = [],
            requestType = "Conversion";

        // @TODO: More pixel types are sent, but no public documentation for this :(
        results.push({
            "key": "requestType",
            "value": requestType,
            "field": "Request Type",
            "group": "general"
        });

        return results;
    }
}
/**
 * Matomo (Formerly Piwik)
 * http://matomo.org
 *
 * @class
 * @extends BaseProvider
 */

class OptimizelyXProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "OPTIMIZELYX";
        this._pattern    = /\.optimizely\.com\/log\/event/;
        this._name       = "Optimizely X";
        this._type       = "testing";
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "account":      "mbox"
        };
    }


    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {

        };
    }
}
/**
 * Pinterest Conversions
 * https://developers.pinterest.com/docs/ad-tools/conversion-tag/?
 *
 * @class
 * @extends BaseProvider
 */
class PinterestProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "PINTERESTPIXEL";
        this._pattern = /ct\.pinterest\.com\/v3\/?/;
        this._name = "Pinterest Conversion";
        this._type = "marketing";
        this._keywords = ["conversion", "pintrk", "pinimg"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "tid",
            "requestType": "requestType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups() {
        return [
            {
                "key": "general",
                "name": "General"
            },
            {
                "key": "event",
                "name": "Event Data"
            },
            {
                "key": "ecommerce",
                "name": "E-Commerce"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys() {
        return {
            "tid": {
                "name": "Tag ID",
                "group": "general"
            },
            "event": {
                "name": "Event",
                "group": "general"
            },
            "cb": {
                "name": "Cache Buster",
                "group": "other"
            },
            "noscript": {
                "name": "Image Tag",
                "group": "other"
            },
            "pd[em]": {
                "name": "Hashed Email Address",
                "group": "general"
            },
            "ed[value]": {
                "name": "Revenue",
                "group": "ecommerce"
            },
            "ed[order_quantity]": {
                "name": "Quantity",
                "group": "ecommerce"
            },
            "ed[currency]": {
                "name": "Currency",
                "group": "ecommerce"
            },
            "ed[order_id]": {
                "name": "Order ID",
                "group": "ecommerce"
            },
            "ed[promo_code]": {
                "name": "Promo Code",
                "group": "ecommerce"
            },
            "ed[property]": {
                "name": "Property",
                "group": "ecommerce"
            },
            "ed[search_query]": {
                "name": "Search Query",
                "group": "event"
            },
            "ed[video_title]": {
                "name": "Video Title",
                "group": "event"
            },
            "ed[lead_type]": {
                "name": "Lead Type",
                "group": "event"
            }
        };
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     *
     * @returns {void|{}}
     */
    handleQueryParam(name, value) {
        let result = {};
        if (name === "ed") {
            // do handling in custom
        } else if (name === "pd") {
            // do handling in custom
        } else {
            result = super.handleQueryParam(name, value);
        }
        return result;
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params) {
        let results = [],
            event = params.get("event") || /* istanbul ignore next: fallback */ "Other",
            pageData = params.get("pd"),
            eventData = params.get("ed"),
            requestType = "Conversion";

        // Request Type
        if (event === "pagevisit") {
            requestType = "Page View";
        } else {
            requestType = event.charAt(0).toUpperCase() + event.slice(1).split(/(?=[A-Z])/).join(" ");
        }        
        results.push({
            "key": "requestType",
            "value": requestType,
            "hidden": true
        });

        // Any page-data
        if (pageData) {
            try { 
                let data = JSON.parse(pageData);
                if (typeof data === "object" && data !== null) {
                    Object.entries(data).forEach(([key, data]) => {
                        let result = super.handleQueryParam(`pd[${key}]`, data);
                        if (result) {
                            results.push(result);
                        }
                    });
                }
            } catch (e) {
                results.push({
                    "key": `pd`,
                    "field": "Page Data",
                    "value": pageData,
                    "group": "general"
                });
            }
        }

        // Any event-data
        if (eventData) {
            try {
                let data = JSON.parse(eventData);
                if (typeof data === "object" && data !== null) {
                    Object.entries(data).forEach(([key, data]) => {
                        if (key === "line_items") {
                            // Line items requires additional parsing
                            if (Array.isArray(data)) {
                                data.forEach((product, i) => {
                                    if (typeof product === "object" && product !== null) {
                                        Object.entries(product).forEach(([productKey, productValue]) => {

                                            // Title case the field name
                                            let field = productKey.replace("product_", "").replace(/_/g, " ").replace(
                                                /\w\S*/g,
                                                (txt) => {
                                                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                                                }
                                            ).replace("Id", "ID");

                                            results.push({
                                                "key": `ed[line_items][${i}][${productKey}]`,
                                                "field": `Product ${i + 1} ${field}`,
                                                "value": productValue,
                                                "group": "ecommerce"
                                            });
                                        });
                                    }
                                });
                            }
                        } else {
                            // Everything is (currently) one level
                            let result = super.handleQueryParam(`ed[${key}]`, data);
                            if (result) {
                                results.push(result);
                            }
                        }
                    });
                }
            } catch (e) {
                results.push({
                    "key": `ed`,
                    "field": "Ecommerce Data",
                    "value": eventData,
                    "group": "ecommerce"
                });
            }
        }

        return results;
    }
}
/**
 * Piwik PRO
 * https://piwik.pro
 *
 * @class
 * @extends BaseProvider
 */

class SegmentProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "SEGMENT";
        this._pattern    = /api\.segment\.io\//;
        this._name       = "Segment";
        this._type       = "analytics";
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "requestType":  "omnibug_requestType"
        };
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {

        };
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params)
    {
        let results = [],
            action = url.pathname.match(/\/v1\/([^/]+)$/);
        if(action) {
            let type = action[1].toLowerCase();
            if(type === "p" || type === "page") {
                type = "Page";
            } else if(type === "i" || type === "identify") {
                type = "Identify";
            } else if(type === "t" || type === "track") {
                type = "Track";
            } else if(type === "s" || type === "screen") {
                type = "Screen";
            } else if(type === "g" || type === "group") {
                type = "Group";
            } else if(type === "a" || type === "alias") {
                type = "Alias";
            } else if(type === "b" || type === "batch") {
                type = "Batch";
            }

            results.push({
                "key":   "omnibug_requestType",
                "value": type,
                "hidden": true
            });
        }
        return results;
    }
}
/**
 * Snap Pixel (Snapchat)
 * https://businesshelp.snapchat.com/en-US/article/snap-pixel-about
 *
 * @class
 * @extends BaseProvider
 */
class SnapchatProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "SNAPCHATPIXEL";
        this._pattern = /tr\.snapchat\.com\/p/;
        this._name = "Snapchat";
        this._type = "marketing";
        this._keywords = ["snap pixel", "snaptr"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "pid",
            "requestType": "requestType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups() {
        return [
            {
                "key": "general",
                "name": "General"
            },
            {
                "key": "ecommerce",
                "name": "E-Commerce"
            },
            {
                "key": "events",
                "name": "Events"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys() {
        return {
            "pid": {
                "name": "Pixel ID",
                "group": "general"
            },
            "ev": {
                "name": "Event",
                "group": "general"
            },
            "pl": {
                "name": "Page URL",
                "group": "general"
            },
            "ts": {
                "name": "Timestamp",
                "group": "other"
            },
            "rf": {
                "name": "Referrer",
                "group": "general"
            },
            "v": {
                "name": "Pixel Version",
                "group": "other"
            },
            "u_hem": {
                "name": "User Email (Hashed)",
                "group": "general"
            },
            "u_hpn": {
                "name": "User Phone Number (Hashed)",
                "group": "general"
            },
            "e_desc": {
                "name": "Description",
                "group": "events"
            },
            "e_sm": {
                "name": "Sign Up Method",
                "group": "events"
            },
            "e_su": {
                "name": "Success",
                "group": "events"
            },
            "e_ni": {
                "name": "Number of Items",
                "group": "ecommerce"
            },
            "e_iids": {
                "name": "Item IDs",
                "group": "ecommerce"
            },
            "e_ic": {
                "name": "Item Category",
                "group": "ecommerce"
            },
            "e_pia": {
                "name": "Payment Info Available",
                "group": "ecommerce"
            },
            "e_cur": {
                "name": "Currency",
                "group": "ecommerce"
            },
            "e_pr": {
                "name": "Price",
                "group": "ecommerce"
            },
            "e_tid": {
                "name": "Transaction ID",
                "group": "ecommerce"
            },
            "e_ss": {
                "name": "Search Keyword",
                "group": "events"
            }
        };
    }

    /**
     * Parse any POST data into param key/value pairs
     *
     * @param postData
     * @return {Array|Object}
     */
    parsePostData(postData = "") {
        let params = [];
        // Handle POST data first, if applicable (treat as query params)
        /* istanbul ignore else: fallback */
        if (typeof postData === "string" && postData !== "") {
            let keyPairs = postData.split("&");
            keyPairs.forEach((keyPair) => {
                let splitPair = keyPair.split("=");
                params.push([splitPair[0], decodeURIComponent(splitPair[1] || "")]);
            });
        } else if (typeof postData === "object") {
            Object.entries(postData).forEach((entry) => {
                // @TODO: consider handling multiple values passed?
                params.push([entry[0], entry[1].toString()]);
            });
        }
        return params;
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params) {
        let results = [],
            event = params.get("ev") || /* istanbul ignore next: fallback */ "other",
            requestType = event.toLowerCase();
        
        requestType = requestType.split("_").map(word => {
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(" ");

        results.push({
            "key": "requestType",
            "value": requestType,
            "hidden": true
        });

        return results;
    }
}
/**
 * Tealium IQ
 * https://tealium.com/products/tealium-iq-tag-management-system/
 *
 * @class
 * @extends BaseProvider
 */

class TwitterProvider extends BaseProvider {
    constructor() {
        super();
        this._key = "TWITTERPIXEL";
        this._pattern = /analytics\.twitter\.com\/i\/adsct/;
        this._name = "Twitter Conversion";
        this._type = "marketing";
        this._keywords = ["twitter", "t.co", "tweet", "uwt.js", "oct.js"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping() {
        return {
            "account": "txn_id",
            "requestType": "requestType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups() {
        return [
            {
                "key": "general",
                "name": "General"
            },
            {
                "key": "events",
                "name": "Events"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys() {
        return {
            "txn_id": {
                "name": "Tag ID",
                "group": "general"
            },
            "p_id": {
                "name": "Pixel Type",
                "group": "general"
            },
            "p_user_id": {
                "name": "User ID",
                "group": "general"
            },
            "events": {
                "name": "Event Data",
                "group": "general"
            },
            "tw_sale_amount": {
                "name": "Revenue",
                "group": "general"
            },
            "tw_order_quantity": {
                "name": "Quantity",
                "group": "general"
            },
            "tpx_cb": {
                "name": "Callback",
                "group": "other"
            },
            "tw_iframe_status": {
                "name": "Is an iFrame",
                "group": "other"
            },
            "tw_document_href": {
                "name": "Page URL",
                "group": "other"
            }
        };
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params) {
        let results = [],
            events = params.get("events"),
            requestType = "other";

        /* istanbul ignore else: nothing happens */
        if (events) {
            try {
                let parsedEvents = JSON.parse(events),
                    requestTypes = [];

                (parsedEvents || /* istanbul ignore next: fallback */[]).forEach(([type, ...data]) => {
                    type = type === "pageview" ? "Page View" : type;
                    requestTypes.push(type);
                });
                requestType = requestTypes.join("|");
            } catch (e) {
                /* istanbul ignore next */
                console.error(e.message);
            }
        }

        results.push({
            "key": "requestType",
            "value": requestType,
            "hidden": true
        });

        return results;
    }
}
/**
 * Universal Analytics
 * https://developers.google.com/analytics/devguides/collection/analyticsjs/
 *
 * @class
 * @extends BaseProvider
 */
class UniversalAnalyticsProvider extends BaseProvider
{
    constructor()
    {
        super();
        this._key        = "UNIVERSALANALYTICS";
        this._pattern    = /\.google-analytics\.com\/([rg]\/)?collect(?:[/?]+|$)/;
        this._name       = "Universal Analytics";
        this._type       = "analytics";
        this._keywords   = ["google", "google analytics", "ua", "ga"];
    }

    /**
     * Retrieve the column mappings for default columns (account, event type)
     *
     * @return {{}}
     */
    get columnMapping()
    {
        return {
            "account":     "tid",
            "requestType": "omnibug_requestType"
        };
    }

    /**
     * Retrieve the group names & order
     *
     * @returns {*[]}
     */
    get groups()
    {
        return [
            {
                "key": "general",
                "name": "General"
            },
            {
                "key": "campaign",
                "name": "Campaign"
            },
            {
                "key": "events",
                "name": "Events"
            },
            {
                "key": "ecommerce",
                "name": "Ecommerce"
            },
            {
                "key": "timing",
                "name": "Timing"
            },
            {
                "key": "dimension",
                "name": "Custom Dimensions"
            },
            {
                "key": "metric",
                "name": "Custom Metrics"
            },
            {
                "key": "promo",
                "name": "Promotions"
            },
            {
                "key": "optimize",
                "name": "Google Optimize"
            },
            {
                "key": "contentgroup",
                "name": "Content Group"
            }
        ];
    }

    /**
     * Get all of the available URL parameter keys
     *
     * @returns {{}}
     */
    get keys()
    {
        return {
            "v": {
                "name": "Protocol Version",
                "group": "general"
            },
            "tid": {
                "name": "Tracking ID",
                "group": "general"
            },
            "aip": {
                "name": "Anonymize IP",
                "group": "general"
            },
            "qt": {
                "name": "Queue Time",
                "group": "general"
            },
            "z": {
                "name": "Cache Buster",
                "group": "general"
            },
            "cid": {
                "name": "Client ID",
                "group": "general"
            },
            "sc": {
                "name": "Session Control",
                "group": "general"
            },
            "dr": {
                "name": "Document Referrer",
                "group": "general"
            },
            "cn": {
                "name": "Campaign Name",
                "group": "campaign"
            },
            "cs": {
                "name": "Campaign Source",
                "group": "campaign"
            },
            "cm": {
                "name": "Campaign Medium",
                "group": "campaign"
            },
            "ck": {
                "name": "Campaign Keyword",
                "group": "campaign"
            },
            "cc": {
                "name": "Campaign Content",
                "group": "campaign"
            },
            "ci": {
                "name": "Campaign ID",
                "group": "campaign"
            },
            "gclid": {
                "name": "Google AdWords ID",
                "group": "campaign"
            },
            "dclid": {
                "name": "Google Display Ads ID",
                "group": "campaign"
            },
            "sr": {
                "name": "Screen Resolution",
                "group": "general"
            },
            "vp": {
                "name": "Viewport Size",
                "group": "general"
            },
            "de": {
                "name": "Document Encoding",
                "group": "general"
            },
            "sd": {
                "name": "Screen Colors",
                "group": "general"
            },
            "ul": {
                "name": "User Language",
                "group": "general"
            },
            "je": {
                "name": "Java Enabled",
                "group": "general"
            },
            "fl": {
                "name": "Flash Version",
                "group": "general"
            },
            "t": {
                "name": "Hit Type",
                "group": "general"
            },
            "en": {
                "name": "Hit Type",
                "group": "general"
            },
            "ni": {
                "name": "Non-Interaction Hit",
                "group": "events"
            },
            "dl": {
                "name": "Document location URL",
                "group": "general"
            },
            "dh": {
                "name": "Document Host Name",
                "group": "general"
            },
            "dp": {
                "name": "Document Path",
                "group": "general"
            },
            "dt": {
                "name": "Document Title",
                "group": "general"
            },
            "cd": {
                "name": "Content Description",
                "group": "general"
            },
            "an": {
                "name": "Application Name",
                "group": "general"
            },
            "av": {
                "name": "Application Version",
                "group": "general"
            },
            "ec": {
                "name": "Event Category",
                "group": "events"
            },
            "ea": {
                "name": "Event Action",
                "group": "events"
            },
            "el": {
                "name": "Event Label",
                "group": "events"
            },
            "ev": {
                "name": "Event Value",
                "group": "events"
            },
            "ti": {
                "name": "Transaction ID",
                "group": "ecommerce"
            },
            "ta": {
                "name": "Transaction Affiliation",
                "group": "ecommerce"
            },
            "tr": {
                "name": "Transaction Revenue",
                "group": "ecommerce"
            },
            "ts": {
                "name": "Transaction Shipping",
                "group": "ecommerce"
            },
            "tt": {
                "name": "Transaction Tax",
                "group": "ecommerce"
            },
            "in": {
                "name": "Item Name",
                "group": "ecommerce"
            },
            "ip": {
                "name": "Item Price",
                "group": "ecommerce"
            },
            "iq": {
                "name": "Item Quantity",
                "group": "ecommerce"
            },
            "ic": {
                "name": "Item Code",
                "group": "ecommerce"
            },
            "iv": {
                "name": "Item Category",
                "group": "ecommerce"
            },
            "cu": {
                "name": "Currency Code",
                "group": "ecommerce"
            },
            "sn": {
                "name": "Social Network",
                "group": "events"
            },
            "sa": {
                "name": "Social Action",
                "group": "events"
            },
            "st": {
                "name": "Social Action Target",
                "group": "events"
            },
            "utc": {
                "name": "User Timing Category",
                "group": "timing"
            },
            "utv": {
                "name": "User Timing Variable Name",
                "group": "timing"
            },
            "utt": {
                "name": "User Timing Time",
                "group": "timing"
            },
            "utl": {
                "name": "User timing Label",
                "group": "timing"
            },
            "plt": {
                "name": "Page load time",
                "group": "timing"
            },
            "dns": {
                "name": "DNS time",
                "group": "timing"
            },
            "pdt": {
                "name": "Page download time",
                "group": "timing"
            },
            "rrt": {
                "name": "Redirect response time",
                "group": "timing"
            },
            "tcp": {
                "name": "TCP connect time",
                "group": "timing"
            },
            "srt": {
                "name": "Server response time",
                "group": "timing"
            },
            "exd": {
                "name": "Exception description",
                "group": "events"
            },
            "exf": {
                "name": "Is exception fatal?",
                "group": "events"
            },
            "ds": {
                "name": "Data Source",
                "group": "general"
            },
            "uid": {
                "name": "User ID",
                "group": "general"
            },
            "linkid": {
                "name": "Link ID",
                "group": "general"
            },
            "pa": {
                "name": "Product Action",
                "group": "ecommerce"
            },
            "tcc": {
                "name": "Coupon Code",
                "group": "ecommerce"
            },
            "pal": {
                "name": "Product Action List",
                "group": "ecommerce"
            },
            "cos": {
                "name": "Checkout Step",
                "group": "ecommerce"
            },
            "col": {
                "name": "Checkout Step Option",
                "group": "ecommerce"
            },
            "promoa": {
                "name": "Promotion Action",
                "group": "ecommerce"
            },
            "xid": {
                "name": "Content Experiment ID",
                "group": "optimize"
            },
            "xvar": {
                "name": "Content Experiment Variant",
                "group": "optimize"
            },
            "_r": {
                "name": "Display Features Enabled",
                "group": "general"
            },
            "requestType": {
                "hidden": true
            }
        };
    }

    /**
     * Parse a given URL parameter into human-readable form
     *
     * @param {string}  name
     * @param {string}  value
     *
     * @returns {void|{}}
     */
    handleQueryParam(name, value)
    {
        let result = {};
        if(/^cd(\d+)$/i.test(name)) {
            result = {
                "key":   name,
                "field": `Custom Dimension ${RegExp.$1}`,
                "value": value,
                "group": "dimension"
            };
        } else if(/^cm(\d+)$/i.test(name)) {
            result = {
                "key":   name,
                "field": `Custom Metric ${RegExp.$1}`,
                "value": value,
                "group": "metric"
            };
        } else if(/^cg(\d+)$/i.test(name)) {
            result = {
                "key":   name,
                "field": `Content Group ${RegExp.$1}`,
                "value": value,
                "group": "contentgroup"
            };
        } else if(/^promo(\d+)([a-z]{2})$/i.test(name)) {
            let lookup = {
                    "id": "ID",
                    "nm": "Name",
                    "cr": "Creative",
                    "ps": "Position"
                },
                type = lookup[RegExp.$2] || "";
            result = {
                "key":   name,
                "field": `Promotion ${RegExp.$1} ${type}`,
                "value": value,
                "group": "promo"
            };
        } else if(/^pr(\d+)([a-z]{2})$/i.test(name)) {
            let lookup = {
                    "id": "ID",
                    "nm": "Name",
                    "br": "Brand",
                    "ca": "Category",
                    "va": "Variant",
                    "pr": "Price",
                    "qt": "Quantity",
                    "cc": "Coupon Code",
                    "ps": "Position"
                },
                type = lookup[RegExp.$2] || "";
            result = {
                "key":   name,
                "field": `Product ${RegExp.$1} ${type}`,
                "value": value,
                "group": "ecommerce"
            };
        } else if(/^pr(\d+)(cd|cm)(\d+)$/i.test(name)) {
            let lookup = {
                    "cd": "Dimension",
                    "cm": "Metric"
                },
                type = lookup[RegExp.$2] || "";
            result = {
                "key":   name,
                "field": `Product ${RegExp.$1} ${type} ${RegExp.$3}`,
                "value": value,
                "group": "ecommerce"
            };
        } else if(/^il(\d+)nm$/i.test(name)) {
            result = {
                "key":   name,
                "field": `Impression List ${RegExp.$1}`,
                "value": value,
                "group": "ecommerce"
            };
        } else if(/^il(\d+)pi(\d+)(cd|cm)(\d+)$/i.test(name)) {
            let lookup = {
                    "cd": "Dimension",
                    "cm": "Metric"
                },
                type = lookup[RegExp.$3] || "";
            result = {
                "key":   name,
                "field": `Impression List ${RegExp.$1} Product ${RegExp.$2} ${type} ${RegExp.$4}`,
                "value": value,
                "group": "ecommerce"
            };
        } else if(/^il(\d+)pi(\d+)([a-z]{2})$/i.test(name))
        {
            let lookup = {
                    "id": "ID",
                    "nm": "Name",
                    "br": "Brand",
                    "ca": "Category",
                    "va": "Variant",
                    "pr": "Price",
                    "ps": "Position"
                },
                type = lookup[RegExp.$3] || "";
            result = {
                "key": name,
                "field": `Impression List ${RegExp.$1} Product ${RegExp.$2} ${type}`,
                "value": value,
                "group": "ecommerce"
            };
        } else {
            result = super.handleQueryParam(name, value);
        }
        return result;
    }

    /**
     * Parse any POST data into param key/value pairs
     *
     * @param postData
     * @return {Array|Object}
     */
    parsePostData(postData = "") {
        let params = [];
        // Handle POST data first, if applicable (treat as query params)
        if (typeof postData === "string" && postData !== "") {
            let keyPairs = postData.split("&");
            keyPairs.forEach((keyPair) => {
                let splitPair = keyPair.split("=");
                params.push([splitPair[0], decodeURIComponent(splitPair[1] || "")]);
            });
        } else if (typeof postData === "object") {
            Object.entries(postData).forEach((entry) => {
                // @TODO: consider handling multiple values passed?
                params.push([entry[0], entry[1].toString()]);
            });
        }
        return params;
    }

    /**
     * Parse custom properties for a given URL
     *
     * @param    {string}   url
     * @param    {object}   params
     *
     * @returns {Array}
     */
    handleCustom(url, params)
    {
        let results = [],
            hitType = params.get("t") || params.get("en") || "page view",
            requestType = "";

        hitType = hitType.toLowerCase();
        if(hitType === "pageview" || hitType === "screenview" || hitType === "page_view") {
            requestType = "Page View";
        } else if(hitType === "transaction" || hitType === "item") {
            requestType = "Ecommerce " + hitType.charAt(0).toUpperCase() + hitType.slice(1);
        } else if(hitType.indexOf("_")) {
            requestType = hitType.replace(/_/g, " ");
        } else {
            requestType = hitType.charAt(0).toUpperCase() + hitType.slice(1);
        }
        results.push({
            "key":    "omnibug_requestType",
            "value":  requestType,
            "hidden": true
        });

        return results;
    }
}



providers = []
providers.push(new AdobeAnalyticsProvider());
providers.push(new AdobeAudienceManagerProvider());
providers.push(new AdobeDynamicTagManagerProvider());
providers.push(new AdobeExperienceIDProvider());
providers.push(new AdobeHeartbeatProvider());
providers.push(new AdobeLaunchProvider());
providers.push(new AdobeTargetProvider());
providers.push(new BingAdsProvider());
providers.push(new CriteoOneTagProvider());
providers.push(new FacebookPixelProvider());
providers.push(new GoogleAdsProvider());
providers.push(new GoogleDoubleClickProvider());
providers.push(new GoogleTagManagerProvider());
providers.push(new LinkedInProvider());
providers.push(new OptimizelyXProvider());
providers.push(new PinterestProvider());
providers.push(new SegmentProvider());
providers.push(new SnapchatProvider());
providers.push(new TwitterProvider());
providers.push(new UniversalAnalyticsProvider());

});
