import Location from "../models/Location.js";

class LocationService {

    static get MAX_LOCATIONS() {
        return 10;
    }

    static get LOCATION_FIELDS() {
        return [
            "city",
            "country",
            "latitude",
            "longitude"
        ];
    }

    async search(searchTerm) {

        const result = await Location.find(
            { $text: { $search: `"${searchTerm}"` } },
            { score: { $meta: "textScore" } }
        ).sort({ score: { $meta: "textScore" } })
            .limit(LocationService.MAX_LOCATIONS)
            .select(LocationService.LOCATION_FIELDS.join(" "));

        return result;
    }

}

export default LocationService;
