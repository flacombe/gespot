import axios from 'axios';

class AddokGeocoder {
    constructor(host) {
        this._host = host;
    }

    static geocode (query){
        var queryFct = async function(query){
            // Requête HTTP
            let addokResp = await axios.get(_host+"/search/?q="+query+"&limit=10");

            // Retour des résultats attendus par Mapbox
            let result = [];
            if (addokResp != null){
                result = addokResp.features;
            }

            return result;
        }
        return await queryFct(query);
    }
}

export {AddokGeocoder as default};