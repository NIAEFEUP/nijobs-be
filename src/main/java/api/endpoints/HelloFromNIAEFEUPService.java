package api.endpoints;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import org.springframework.stereotype.Service;

@Service
@Path("/ni")
public class HelloFromNIAEFEUPService {

    @GET
    @Produces("text/plain")
    @Path("/hello")
    public final String abc() {
        return "Hello from NIAEFEUP :)";
    }
}
