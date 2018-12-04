package api.config;

import api.endpoints.*;
import org.glassfish.jersey.server.ResourceConfig;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JerseyConfig extends ResourceConfig {

    public JerseyConfig() {
        register(HelloFromNIAEFEUPService.class);
        register(ReverseService.class);
    }
}
