#!/bin/bash
docker run -i --init --rm --cap-add=SYS_ADMIN --shm-size=1gb -p 8901:8901 --restart html2pdf