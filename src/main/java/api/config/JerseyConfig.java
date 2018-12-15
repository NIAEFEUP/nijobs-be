package api.config;

import api.endpoints.HelloFromNIAEFEUPService;
import api.endpoints.ReverseService;
import org.glassfish.jersey.server.ResourceConfig;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JerseyConfig extends ResourceConfig {

    public JerseyConfig() {
        register(HelloFromNIAEFEUPService.class);
        register(ReverseService.class);
    }
}
