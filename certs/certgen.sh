#!/bin/sh

openssl req -x509 -newkey rsa:2048 -passout pass:AR4ND0MSTR1NG -keyout keytmp.pem -out cert.pem -days 365 -subj "/C=PT/ST=Porto/L=Porto/O=NIAEFEUP/OU=NIJobs/CN=ni.fe.up.pt"

openssl rsa -in keytmp.pem -passin pass:AR4ND0MSTR1NG -out key.pem
