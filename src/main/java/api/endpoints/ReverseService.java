package api.endpoints;

import javax.validation.constraints.NotNull;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import org.springframework.stereotype.Service;

@Service
@Path("/reverse")
public class ReverseService {

    @GET
    @Produces("text/plain")
    public final String reverse(@QueryParam("data") @NotNull final String data) {
        return new StringBuilder(data).reverse().toString();
    }
}
