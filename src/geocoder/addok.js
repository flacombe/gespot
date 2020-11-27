import axios from 'axios';

class AddokGeocoder {
    constructor(host) {
        this._host = host;
    }

    geocode (query){
        let _geocode = async function (host, query){
            // Requête HTTP
            return axios.get(host+"/search/?q="+query+"&limit=10")
            .then((addokResp) => {
                let result = [];
                if (addokResp != null){
                    result = addokResp.data.features;
                }
                return result;
            });
        }

        let result = [];
        _geocode(this._host, query).then((response) => {
            result = response;
        })
        return result;
    }
}

export {AddokGeocoder as default};