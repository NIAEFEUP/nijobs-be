import Location from "../models/Location";

class LocationService {

    get MAX_LOCATIONS() {
        return 10;
    }

    get LOCATION_FIELDS() {
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
            .limit(this.MAX_LOCATIONS)
            .select(this.LOCATION_FIELDS.join(" "));

        return result;
    }

}

export default LocationService;
